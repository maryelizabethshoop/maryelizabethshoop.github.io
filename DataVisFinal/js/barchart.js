class Barchart {
  
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      colorScale: _config.colorScale,
      containerWidth: 1100,
      containerHeight: 400,
      margin: _config.margin || { top: 25, right: 20, bottom: 30, left: 40 },
    };
    this.data = _data;
    this.yValue = d => d.early_career_pay - d.out_of_state_total;
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.overviewHeight = 60;
    vis.selectorHeight = 30;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    vis.totalHeight = vis.config.containerHeight + vis.overviewHeight + vis.selectorHeight;

    vis.svg2 = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.totalHeight);

    vis.chart = vis.svg2.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    

    vis.xScale = d3.scaleBand().range([0, vis.width]);
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickSizeOuter(0);
    vis.yAxis = d3.axisLeft(vis.yScale)
      .ticks(8)
      .tickSizeOuter(0)
      .tickFormat(d => '$'+(d/1000)+'k');

    vis.xAxisG = vis.chart.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.height})`);

    vis.yAxisG = vis.chart.append('g')
      .attr('class', 'axis y-axis');

    vis.svg2.append('text')
      .attr('class', 'axis-title')
      .attr('x', vis.config.margin.left)
      .attr('y', 15);

    // Overview (mini chart) and mover
    vis.xOverview = d3.scaleBand().range([0, vis.width]).padding(0.3);
    vis.yOverview = d3.scaleLinear().range([vis.overviewHeight, 0]);

    vis.overview = vis.svg2.append('g')
      .attr('class', 'overview')
      .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.containerHeight + 20})`);

    vis.mover = vis.overview.append('rect')
      .attr('class', 'mover')
      .attr('y', 0)  // Aligns with top of overview bars
      .attr('height', vis.overviewHeight)
      .attr('cursor', 'ew-resize')
      .attr('fill', 'rgba(200, 200, 200, 0.5)');

    vis.tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  updateVis() {
    if (this.data.length > 0) {
      d3.select('#error-message').remove();  // Remove the error message if any
  }
    if (this.data.length === 0) {
      d3.select('#barchart')
      .append('text')  // Create a text element
      .attr('id', 'error-message')  // Add an ID for styling
      .attr('x', '50%')  // Position in the center horizontally
      .attr('y', '50%')  // Position in the center vertically
      .attr('text-anchor', 'middle')  // Center the text horizontally
      .style('font-size', '18px')  // Set the font size
      .style('fill', 'red')  // Set the font color to red
      .text("No data matches your filter.  Please try a different search.");
      return; // Exit the function to avoid errors when trying to render with empty data
    }
    let vis = this;

    vis.xValue = d => d.name;
    vis.colorValue = d => d.enrollment_bin;

    vis.data.sort((a, b) => vis.yValue(b) - vis.yValue(a));
    vis.fullData = vis.data;

    vis.numBars = Math.min(8, vis.data.length);


    vis.yScale.domain(d3.extent(vis.data, d => vis.yValue(d)));
    if (vis.yScale.domain()[0] > 0) vis.yScale.domain([0, vis.yScale.domain()[1]]);
    if (vis.yScale.domain()[1] < 0) vis.yScale.domain([vis.yScale.domain()[0], 0]);

    vis.displayStart = 0;
    vis.displayEnd = Math.min(vis.numBars, vis.fullData.length);

    vis.updateMainChart();

    // Overview chart
    vis.xOverview.domain(vis.fullData.map(vis.xValue));
    vis.yOverview.domain(vis.yScale.domain());

    vis.overview.selectAll('.subBar')
    .data(vis.fullData)
    .join('rect')
    .attr('class', 'subBar')
    .attr('x', d => vis.xOverview(vis.xValue(d)))
    .attr('y', d => vis.yOverview(Math.max(0, vis.yValue(d))))
    .attr('height', d => Math.abs(vis.yOverview(vis.yValue(d)) - vis.yOverview(0)))
    .attr('width', vis.xOverview.bandwidth())
    .attr('fill', '#999')
    .style('pointer-events', 'none');

    // Remove old baseline first
    vis.chart.selectAll('.baseline').remove();

    // Add new baseline
    vis.chart.append('line')
      .attr('class', 'baseline')
      .attr('x1', 0)
      .attr('x2', vis.width)
      .attr('y1', vis.yScale(0))
      .attr('y2', vis.yScale(0))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');  

    let moverWidth = vis.fullData.length <= vis.numBars
      ? vis.width
      : vis.width * vis.numBars / vis.fullData.length;

    vis.mover
      .attr('x', 0)
      .attr('width', moverWidth)
      .call(d3.drag().on('drag', function (event) {
        let x = parseFloat(d3.select(this).attr('x')) + event.dx;
        x = Math.max(0, Math.min(vis.width - moverWidth, x));
        d3.select(this).attr('x', x);

        let startIdx = Math.round((x / vis.width) * vis.fullData.length);
        vis.displayStart = startIdx;
        vis.displayEnd = startIdx + vis.numBars;
        vis.updateMainChart();
      }));
  }

  updateMainChart() {
    let vis = this;

    const visibleData = vis.fullData.slice(vis.displayStart, vis.displayEnd);
    vis.xScale.domain(visibleData.map(vis.xValue));

    let barCount = visibleData.length;
    vis.xScale
      .paddingInner(barCount < 5 ? 0.5 : 0.3)
      .paddingOuter(barCount < 5 ? 0.4 : 0.1); 

    vis.chart.selectAll('.bar')
      .data(visibleData, d => d.name)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => vis.xScale(vis.xValue(d)))
      .attr('y', d => vis.yScale(Math.max(0, vis.yValue(d))))
      .attr('height', d => Math.abs(vis.yScale(vis.yValue(d)) - vis.yScale(0)))
      .attr('width', Math.max(1, vis.xScale.bandwidth() - 2))
      .attr('fill', d => vis.config.colorScale(vis.colorValue(d)));
      
      vis.chart.selectAll('.bar')
      .data(visibleData, d => d.name)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => vis.xScale(vis.xValue(d)))
      .attr('y', d => vis.yScale(Math.max(0, vis.yValue(d))))
      .attr('height', d => Math.abs(vis.yScale(vis.yValue(d)) - vis.yScale(0)))
      .attr('width', Math.max(1, vis.xScale.bandwidth() - 2))
      .attr('fill', d => vis.config.colorScale(vis.colorValue(d)))
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke', 'black');
        vis.tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.name}</strong><br/>
            Salary-Tuition Disparity: $${(vis.yValue(d)/1000).toFixed(1)}k
          `);
      })
      .on('mousemove', function(event) {
        vis.tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseleave', function() {
        d3.select(this).attr('stroke', 'none');
        vis.tooltip.style('opacity', 0);
      });

            // School selector
      vis.chart.selectAll('.bar')
        .on('click', (event, d) => {
        // Check if already selected
        const alreadySelected = selectedSchools.find(s => s.name === d.name);
        if (!alreadySelected) {
          selectedSchools.push(d);
          highlightSelectedSchools();
          renderSelectedSchools();
        }
      });

    vis.xAxisG
      .call(vis.xAxis)
      .attr('transform', `translate(0, ${vis.height})`);
    vis.xAxisG.selectAll(".tick text")
      .call(wrapText, vis.xScale.bandwidth());
    vis.yAxisG.call(vis.yAxis);
  }
}

function wrapText(text, width) {
  text.each(function () {
    const textEl = d3.select(this);
    const words = textEl.text().split(/\s+/).reverse();
    let word;
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.1; // ems
    const y = textEl.attr("y");
    const dy = parseFloat(textEl.attr("dy") || 0);
    let tspan = textEl.text(null)
      .append("tspan")
      .attr("x", 0)
      .attr("y", y)
      .attr("dy", dy + "em");

    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));

      // If the current line exceeds the fixed width (14 characters)
      if (tspan.node().getComputedTextLength() > width+5) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = textEl.append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  })};
