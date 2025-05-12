class Scatterplot {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        colorScale: _config.colorScale,
        controlScale: _config.controlScale,
        containerWidth: 900,
        containerHeight: 600,
        margin: _config.margin || {top: 30, right: 20, bottom: 20, left: 40},
        tooltipPadding: _config.tooltipPadding || 15
      }
      this.data = _data;
      //defining this here allows it to be changed in updateVis
      this.yValue = d => d.out_of_state_total;

      this.initVis();
    }
    
    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
      let vis = this;
    
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      vis.xScale = d3.scaleLinear()
          .range([0, vis.width]);
  
      vis.yScale = d3.scaleLinear()
          .range([vis.height, 0]);
  
      // Initialize axes
      vis.xAxis = d3.axisBottom(vis.xScale)
          .ticks(6)
          .tickSize(-vis.height - 10)
          .tickPadding(10)
          .tickFormat(d => '$'+(d/1000)+'k');
  
      vis.yAxis = d3.axisLeft(vis.yScale)
          .ticks(6)
          .tickSize(-vis.width - 10)
          .tickPadding(10)
          .tickFormat(d => '$'+(d/1000)+'k');
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
  
      // Append group element that will contain our actual chart 
      // and position it according to the given margin config
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Append empty x-axis group and move it to the bottom of the chart
      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);
      
      // Append y-axis group
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');
  
      // Append both axis titles
      vis.chart.append('text')
          .attr('class', 'axis-title')
          .attr('y', vis.height - 15)
          .attr('x', vis.width + 10)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text('Early Career Pay');
  
      vis.svg.append('text')
          .attr('class', 'axis-title')
          .attr('x', 0)
          .attr('y', 1)
          .attr('dy', '.71em')
          .text('Tuition');

    vis.colorScale = d3.scaleOrdinal()
        .domain(['Small', 'Medium', 'Large'])
        .range(['#a8e6a3', '#4caf50', '#1b5e20']);
     // and symbol scale 
    vis.symbol = d3.scaleOrdinal()
     .domain(['Public', 'Private'])
     .range([d3.symbolSquare, d3.symbolTriangle]);


      // Symbol legend 
      const legendContainer = d3.select('#legend-container');
      legendContainer.append('h4').text('School Type')
      vis.symbol.domain().forEach(category => {
        const row = legendContainer.append('div')
          .attr('class', 'legend-row')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('margin-bottom', '4px');
          const symbolPath = d3.symbol().type(vis.symbol(category))();
        row.append('svg')
          .attr('width', 20)
          .attr('height', 20)
          .attr('viewBox', '-10 -10 20 20')
          .append('path')
          .attr('d', symbolPath)
          .attr('fill', 'black')
        row.append('span')
          .text(` ${category}`)
          .style('margin-left', '5px');
      });
      // Color legend
      legendContainer.append('h4').text('School Size');
      vis.config.colorScale.domain().forEach(controlType => {
      const row = legendContainer.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin-bottom', '4px');
      row.append('div')
        .style('width', '15px')
        .style('height', '15px')
        .style('background-color', vis.config.colorScale(controlType))
        .style('margin-right', '6px');
      row.append('span')
        .text(controlType);
});
    }
  
    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
      if (this.data.length > 0) {
        d3.select('#error-message').remove();  // Remove the error message if any
    }
      if (this.data.length === 0) {
        d3.select('#scatterplot')
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
      
      // Specificy accessor functions
      vis.colorValue = d => d.enrollment_bin;
      vis.symbolValue = d => d.type; 
      vis.xValue = d => d.early_career_pay;
      
  
      // Set the scale input domains
      vis.xScale.domain([0, d3.max(vis.data, vis.xValue)]);
      vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);
     
      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements.
     */
    renderVis() {
      let vis = this;

      const xMin = vis.xScale.domain()[0];
      const xMax = vis.xScale.domain()[1];
      const yMin = vis.yScale.domain()[0];
      const yMax = vis.yScale.domain()[1];
      //console.log(xMin, xMax, yMin, yMax);

      vis.chart.selectAll('.equal-line').data([0]).join('line')
      .attr('class', 'equal-line')
      .attr('x1', vis.xScale(0))
      .attr('y1', vis.yScale(0))
      .attr('x2', vis.xScale(Math.min(vis.xScale.domain()[1], vis.yScale.domain()[1])))
      .attr('y2', vis.yScale(Math.min(vis.xScale.domain()[1], vis.yScale.domain()[1])))
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    vis.chart.append("text")
        .attr("x", vis.xScale(xMin)) 
        .attr("y", vis.yScale(yMax))
        .attr("class", "annotation")
        .style("fill", "orange")
        .call(text => {
          text.append("tspan")
              .attr("x", vis.xScale(xMin))
              .style("font-size", "30px")
              .attr("dy", "0.5em")
              .text("Least Favorable");
          text.append("tspan")
              .attr("x", vis.xScale(xMin))
              .style("font-size", "20px")
              .attr("dy", "1.2em")
              .text("Tuition is high, salary is low");
          text.append("tspan")
              .attr("x", vis.xScale(xMin))
              .style("font-size", "15px")
              .attr("dy", "6em")
              .style("fill", "red")
              .text("On this side of the line, expected");
          text.append("tspan")
              .attr("x", vis.xScale(xMin))
              .style("font-size", "15px")
              .attr("dy", "1.2em") // Moves it down from the previous tspan
              .style("fill", "red")
              .text("salary is less than tuition");
        });
        vis.chart.append("text")
        .attr("x", vis.xScale(xMax)) // position near the line
        .attr("y", vis.yScale(yMin)-35)
        .attr("class", "annotation")
        .call(text => {
          text.append("tspan")
              .attr("x", vis.xScale(xMax)-250)
              .style("font-size", "30px")
              .attr("dy", "-1.5em")
              .style("fill", "orange")
              .text("Most Favorable");
          text.append("tspan")
              .attr("x", vis.xScale(xMax)-255)
              .style("font-size", "20px")
              .attr("dy", "1.2em")
              .style("fill", "orange")
              .text("Tuition is low, salary is high");
          text.append("tspan")
              .attr("x", vis.xScale(xMax)-210)
              .style("font-size", "15px")
              .attr("dy", "-12em")
              .style("fill", "red")
              .text("On this side of the line, expected");
          text.append("tspan")
              .attr("x", vis.xScale(xMax) - 210)
              .style("font-size", "15px")
              .attr("dy", "1.2em") // Moves it down from the previous tspan
              .style("fill", "red")
              .text("salary is greater than tuition");
        
        });

      function jitter(value) {
        var num = Math.floor(Math.random()*5) + 1; 
        num *= Math.round(Math.random()) ? 1 : -1; 
        return value + num;
    }
  
    // Add circles
    this.symbols = vis.chart.selectAll('.symbol')
      .data(vis.data, d => d.name)
    .join('path')
      .attr('class', 'symbol')
      .attr('transform', d => `translate(${jitter(vis.xScale(vis.xValue(d)))}, ${vis.yScale(vis.yValue(d))})`)
      .attr('d', d => d3.symbol().type(vis.symbol(vis.symbolValue(d)))())
      .attr('fill', d => vis.config.colorScale(vis.colorValue(d)))
      .attr('stroke', d => selectedSchools.some(s => s.name === d.name) ? 'black' : 'none')
      .attr('stroke-width', d => selectedSchools.some(s => s.name === d.name) ? 2 : 0);

      this.symbols
      .on('click', (event, d) => {
        const alreadySelected = selectedSchools.find(s => s.name === d.name);
        if (!alreadySelected) {
          selectedSchools.unshift(d); // Add to the beginning
          highlightSelectedSchools();
          renderSelectedSchools();
          barchart.data = selectedSchools; // Update bar chart data
          barchart.updateVis();            // Re-render
        }
      });
  
      // Tooltip event listeners
      this.symbols
          .on('mouseover', (event,d) => {
            d3.select('#tooltip')
              .style('display', 'block')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              .html(`
                <div class="tooltip-title">${d.name}</div>
                <div><i>${d.state}</i></div>
                <ul>
                  <li> In state tuition: $${formatComma(d.in_state_total)}, Out of state tuition: $${formatComma(d.out_of_state_total)}</li>
                  <li> Average early career salary: $${formatComma(d.early_career_pay)} </li>
                  <li> (Salary - Tuition): $${formatComma(vis.xValue(d) - vis.yValue(d))}</li>
                  <li>${d.enrollment_bin}, ${d.type} University</li>
                </ul>
              `);
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
          });
      
      // Update the axes/gridlines
      // We use the second .call() to remove the axis and just show gridlines
      vis.xAxisG
          .call(vis.xAxis)
          .call(g => g.select('.domain').remove());
  
      vis.yAxisG
          .call(vis.yAxis)
          .call(g => g.select('.domain').remove())
    }
  }