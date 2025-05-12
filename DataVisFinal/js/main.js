// Global objects go here (outside of any functions)
// Set SVG width and height
const barW = 1000
const barH = 400
const formatComma = d3.format(",");

let difficultyFilter = [];
let selectedSchools = [];

/**
 * Use drop down filters
 */
function applyFilters() { 

    const selectedState = document.getElementById('state-select').value;
    const selectedTuition = document.getElementById('tuition-select').value;
    const selectedType = document.getElementById('type-select').value;
  
    let filteredData = data; // originalData should be a global copy of your raw data
  
    if (selectedState !== 'all') {
      filteredData = filteredData.filter(d => d.state === selectedState);
    }
  
    if (selectedType !== 'all') {
      filteredData = filteredData.filter(d => d.enrollment_bin === selectedType);
    }
  
    // Update yValue to reflect the selected tuition type
    scatterplot.yValue = d => selectedTuition === 'in_state_total' ? d.in_state_total : d.out_of_state_total;
    

    scatterplot.data = filteredData;
    scatterplot.updateVis();

    barchart.yValue = d => selectedTuition === 'in_state_total' ? d.early_career_pay - d.in_state_total : d.early_career_pay - d.out_of_state_total;
  
    barchart.data = filteredData;
    barchart.updateVis();
  }
/**
 * Shows information on selected schools 
 */
function renderSelectedSchools() {
    const container = d3.select('#school-info-container');

    container.html(''); // Clear previous content

    selectedSchools.forEach(school => {
      const card = container.append('div')
        .attr('class', 'school-card')
        .html(`
          <h4>${school.name} <span class="remove-school" style="cursor:pointer; color:red; float:right;">&times;</span></h4>
        <p>State: ${school.state}</p>
        <p>In-State Tuition: $${formatComma(school.in_state_total)}</p>
        <p>Out-of-State Tuition: $${formatComma(school.out_of_state_total)}</p>
        <p>Average Early Career Salary: $${formatComma(school.early_career_pay)}</p>
        <p> (Salary - Tuition): $${formatComma(scatterplot.xValue(school) - scatterplot.yValue(school))}</p>
        <p>${school.enrollment_bin}, ${school.type}</p>
      `);
  // Attach click event to the "×" button
  card.select('.remove-school')
  .on('click', () => {
    selectedSchools = selectedSchools.filter(s => s.name !== school.name);
    highlightSelectedSchools();
    renderSelectedSchools();

    if (selectedSchools.length === 0) {
      applyFilters(); // Reapply current filters
    } else {
      barchart.data = selectedSchools;
      barchart.updateVis();
    }
  });
    });
  }
/**
 * Highlights scatterplot point for selected schools
 */ 
  function highlightSelectedSchools() {
    d3.selectAll('.symbol')
      .attr('stroke', d => selectedSchools.some(s => s.name === d.name) ? 'black' : 'none')
      .attr('stroke-width', d => selectedSchools.some(s => s.name === d.name) ? 2 : 0);
  }
  

const dispatcher = d3.dispatch('filterCategories');

dispatcher.on('filterCategories', selectedCategories => {
    const filteredData = selectedCategories.length === 0
      ? data
      : data.filter(d => selectedCategories.includes(d.enrollment_bin));
  
    scatterplot.data = filteredData;
    scatterplot.updateVis();
  });

const svg = d3.select('#scatterplot')
    .attr('width', barW)
    .attr('height', barH);
const svg2 = d3.select('#scroll-barchart-container')
  .attr('width', barW)
  .attr('height', barH);


//data preprocessing
let data, scatterplot, barchartScroll; 

d3.csv('data/final_data_bins.csv')
   .then(_data => {
     data = _data; // for safety, so that we use a local copy of data.

     data.forEach(d =>{
        d.in_state_total = +d.in_state_total;
        d.out_of_state_total = +d.out_of_state_total;
        d.early_career_pay = +d.early_career_pay;
        d.enrollment = +d.enrollment;
     })
     const width = barW - 55;
     const height = barH - 45;
    

     // Initialize color scale
     const colorScale = d3.scaleOrdinal()
        .domain(['Small', 'Medium', 'Large'])
        .range(['#a8e6a3', '#4caf50', '#1b5e20']);
     // and symbol scale 
     const controlScale = d3.scaleOrdinal()
      .domain(['Public', 'Private'])
      .range([d3.symbolSquare, d3.symbolTriangle]);

     scatterplot = new Scatterplot({parentElement: '#scatterplot', colorScale: colorScale, controlScale: controlScale}, data);
     scatterplot.updateVis();

     barchart = new Barchart({parentElement: '#barchart', colorScale: colorScale}, data);
     barchart.updateVis();


    //Reverse effects of a search by pressing "Esc"
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        // Clear the search bar input
        document.getElementById('search-bar').value = '';
    
        // Reset all scatterplot symbols
        scatterplot.symbols
          .attr('stroke', 'none')
          .attr('stroke-width', 0)
          .attr('opacity', 1);
      }
      // Search Bar Responsiveness
      if (e.key === 'Enter') {
        const searchTerm = document.getElementById('search-bar').value.toLowerCase();
        scatterplot.symbols
          .attr('stroke', d => d.name.toLowerCase().includes(searchTerm) ? 'black' : 'none')
          .attr('stroke-width', d => d.name.toLowerCase().includes(searchTerm) ? 2 : 0)
          .attr('opacity', d => searchTerm && !d.name.toLowerCase().includes(searchTerm) ? 0.2 : 1)
          .style('z-index',  d => d.name.toLowerCase().includes(searchTerm) ? 10 : 1);
      }
    });

      // Add event listeners
      document.getElementById('state-select').addEventListener('change', applyFilters);
      document.getElementById('tuition-select').addEventListener('change', applyFilters);
      document.getElementById('type-select').addEventListener('change', applyFilters);

     const states = [...new Set(data.map(d => d.state))].sort();

    const stateSelect = document.getElementById('state-select');
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
          });
     //console.log(data);
   })
  .catch(error => console.error(error));

