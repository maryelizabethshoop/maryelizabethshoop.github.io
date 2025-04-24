
// Global objects go here (outside of any functions)
let difficultyFilter = [];
const dispatcher = d3.dispatch('filterCategories');

/**
 * Load data from CSV file asynchronously and render charts
 */

let data, scatterplot, barchart; 

d3.csv('data/vancouver_trails.csv')
   .then(_data => {
     data = _data; // for safety, so that we use a local copy of data.
 
     data.forEach(d => { 
        d.time = +d.time; 
        d.distance = +d.distance;
     })


     // Initialize scale
     const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.difficulty))
        .range(['#a1d99b', '#41ab5d', '#005a32']); // add an ordinal scale for the difficulty

        scatterplot = new Scatterplot({
            parentElement: '#scatterplot',
            colorScale: colorScale}, data); 
        scatterplot.updateVis();

        barchart = new Barchart({ 
            parentElement: '#barchart',
            colorScale: colorScale}, data, dispatcher); 
        barchart.updateVis();
   })
  .catch(error => console.error(error));


/**
 * Use bar chart as filter and update scatter plot accordingly
 */
dispatcher.on('filterCategories', selectedCategories => {
	if (selectedCategories.length == 0) {
		scatterplot.data = data;
	} else {
		scatterplot.data = data.filter(d => selectedCategories.includes(d.difficulty));
	}
	scatterplot.updateVis();
});





