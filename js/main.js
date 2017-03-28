//Mengyu Liang
// module 8 mapping in D3
//this script loads in the Topojson spatial and attribute data using d3 operators, and also creates a basemap 
	//the US states that would be used later for creating a choropleth map

//start to execute the following codes when window loads
window.onload=setMap();

//set up choropleth map with a function 
function setMap(){
	//set the map frame dimension
	var width=1000,
		height=560;

	//append the map bloack to a svg container 
	var map=d3.select("body")
		.append("svg")
		.attr("class","map")
		.attr("width",960)
		.attr("height",600);

	//create a projection for the map using the US. centric composite projection to also
		//include Hawaii and Alaska for the purpose of cretaing a choropleth map later
	var projection=d3.geoAlbersUsa()
		//this projection does not need to take in the following parameters
		//.center([0,39])
		//.rotate([-2,0,0])
		//.parallels([43,62])
		//.scale([2500])*/
		.translate([width/2,height/2]);

	//create a path generator and pass in the projection from the projection operator  
	var path=d3.geoPath()
		.projection(projection);

	//use d3.queue to load in data from different files at the same time
	d3.queue()
        .defer(d3.csv, "data/stateData.csv") //load attribute data from the csv file
        .defer(d3.json, "data/country.topojson") //load the North America background spatial data
        .defer(d3.json, "data/usState.topojson") //load choropleth spatial data of the US states
        .await(callback); //fires after all the data is loaded and sends the data to the callback function 

    //a callback function with the loaded data from above 
	function callback(error, csvData, countries, state){
		console.log(error); //if there is any error
		console.log(csvData); //attribute data
		console.log(countries);
		console.log(state);


		//the following blocks of codes create graticules and graticule background, 
			//but is not needed for a choropleth map of the US
		/*var graticule=d3.geoGraticule()
			.step([5,5]);

		var gratBackground=map.append("path")
			.datum(graticule.outline())
			.attr("class","gratBackground")
			.attr("d",path);
		var gratLines=map.selectAll(".gratLines")
			.data(graticule.lines())
			.enter()
			.append("path")
			.attr("class","gratLines")
			.attr("d",path);*/

		//translate the topojson data back to geojson data within DOM with the obejcts within the data that we want to convert
		//var northAmerica=topojson.feature(countries,countries.objects.ne_50m_admin_0_countries),
		var	usStates=topojson.feature(state,state.objects.ne_50m_admin_1_states_provinces_lakes).features;

		//examine the resulting geojson
		//console.log(northAmerica);
		console.log(usStates);

		//the following block adds background of north America countires, but is not needed for a 
			//choropleth map of the US
		/*var background=map.append("path")
			.datum(northAmerica)
			.attr("class","background")
			.attr("d",path);*/

		//add each state separately as path onto the map
		var regions=map.selectAll(".states")
			.data(usStates)
			.enter()
			.append("path")
			.attr("class",function(d){
				//assign a unique class name based on the local code of each state
				return "states"+d.properties.code_local;
			})
			//draw each state with the path generator
			.attr("d",path);





		 //europeCountries=topojson.feature(europe,europe.objects.EuropeCountries),
		//var	usStates=topojson.feature(state,state.objects.states).features;
		//console.log(usStates);
		
		/*var countries=map.append("path")
			.datum(europeCountries)
			.attr("class","countries")
			.attr("d",path);*/
		/*var regions=map.selectAll(".regions")
			.data(franceRegions)
			.enter()
			.append("path")
			.attr("class",function(d){
				return "regions "+d.properties.state;
			})
			.attr("d",path);*/


		//console.log(europeCountries);
		//console.log(franceRegions);

        /*console.log(error);
        console.log(csvData);
        console.log(europe);
        console.log(france);*/
    };
};

