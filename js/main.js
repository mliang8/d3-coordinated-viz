//Mengyu Liang
// module 9 mapping in D3
//this script joins the attribute data to the geojson enumeration units, and then create chropleth map
	//of the US; in addition, a coordinated view of bar graph allows an alternative way to view the dataset

//wrap everything in a self-executing anonymous function to move to local scope
(function(){

	//psudo global variables 
	//store all the variables for data join to an array
	var attrArray =["unemployment16OrOlder2010","collegeGradRate2010","medianHouseholdIncome2010","foreignBornPop2010","percentageHighTechEmployment2010"];
	var expressed=attrArray[0];//inital attribute

	//start to execute the following codes when window loads
	window.onload=setMap();

	//set up choropleth map with a function 
	function setMap(){
		//set the map frame dimension
		var width=window.innerWidth*0.8,
			height=540;

		//append the map bloack to a svg container 
		var map=d3.select("body")
			.append("svg")
			.attr("class","map")
			.attr("width",width)
			.attr("height",height);

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


			//translate the topojson data back to geojson data within DOM with the obejcts within the data that we want to convert
			//var northAmerica=topojson.feature(countries,countries.objects.ne_50m_admin_0_countries),
			var	usStates=topojson.feature(state,state.objects.ne_50m_admin_1_states_provinces_lakes).features;

			//examine the resulting geojson
			console.log(usStates);

			//join csv data to geojson enumeration units
			usStates=joinData(usStates,csvData);

			//create the color scale
			var colorScale=makeColorScale(csvData);

			//add enumeration units to the map
			setEnumerationUnits(usStates,map, path, colorScale);

			//set coordinated visualization to the map
			setChart(csvData,colorScale);
			sunChart(csvData, colorScale);
		};

	};
	//this function joins the csv attribute data to the enumeration units in geojson based on the 
		//common filed of code_local through loops
	function joinData(usStates,csvData){
		//loop through the csv file to assign each set of csv attribute to geojson regions
		for (var i=0; i<csvData.length; i++){
			var csvRegion= csvData[i]; //access the current indexed region
			var csvKey=csvRegion.code_local;//the csv primary key 

			//loop through the geojson regions to find the correct regions 
			for (var a=0; a<usStates.length;a++){
				var geojsonProps=usStates[a].properties;//the current indexed region geojson properties
				var geojsonKey=geojsonProps.code_local;//the geojson primary key 

				//when the csv primary key matches the geojson primary key, transfer the csv data to geojson objects' properties
				if (geojsonKey==csvKey){
					//assign all attributes and values 
					attrArray.forEach(function(attr){
						var val=parseFloat(csvRegion[attr]); //get all the csv attribute values
						geojsonProps[attr]=val;//assign the attribute and values to geojson properties
						//console.log(geojsonProps[attr]);

					});
				};
			};
		};
		//returning the enumeration units with attrbite values joined
		return usStates;
	};
			
	//this function 
	function setEnumerationUnits(usStates,map, path, colorScale){
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
			.attr("d",path)
			//add styles to color in the enumeration units by calling the choropleth funciton
				//with the attribute values and the colorScale later defined
			.style("fill", function(d){
				return choropleth(d.properties, colorScale);
			});
	};

	//function to create color scale generator 
	function makeColorScale(data){
		var colorClasses=[
			"#ffffb2",
			"fecc5c",
			"fb8d3c",
			"f03b20",
			"bd0026"

		];
		//create color scale generator
		var colorScale=d3.scaleThreshold()
			.range(colorClasses);

		//build arrary of all values of the expressed attribute
		var domainArray= [];
		for (var i=0; i<data.length; i++){
			var val=parseFloat(data[i][expressed]);
			domainArray.push(val);
		};

		//cluster data using ckmeans clustering algorithm to create natural breaks
		var clusters=ss.ckmeans(domainArray,5);

		//reset domain arrary to cluster minimums
		domainArray=clusters.map(function(d){
			return d3.min(d);
		});

		//remove first value from domain arrary to create class breakpoints
		domainArray.shift();

		//assign array of last 4 cluster minimyms as domain
		colorScale.domain(domainArray);
		// return the varibale colorScale for easier referencing
		return colorScale;
	};

	//function to test for data value and return color
	function choropleth(props, colorScale){
		//make sure attribute value is a number
		var val=parseFloat(props[expressed]);
		//if attribute value exists, assign a color; otherwise gray
		if (typeof val=='number' &&!isNaN(val)){
			return colorScale(val);
		} else {
			return "#CCC";
		};
	};

	//function to craete coordinate bar chart
	function setChart(csvData,colorScale){
		//set chart frame dimension, including the inner padding for the bars and leaving some space
			//for creating the vertical axis and increments
		var chartWidth=window.innerWidth*0.8,
			chartHeight=473,
			leftPadding=25,
			rightPadding=5,
			topBottomPadding=5,
			chartInnerWidth=chartWidth-leftPadding-rightPadding,
			chartInnerHeight=chartHeight-2*topBottomPadding,
			translate="translate("+leftPadding+","+topBottomPadding+")";

		//create a second svg elemnt to hold the bar chart
		var chart=d3.select("body")
			.append("svg")
			.attr("width",chartWidth)
			.attr("height",chartHeight)
			.attr("class","chart");

		//craete a rectangle for chart background fill
		var chartBackground= chart.append("rect")
			.attr("class","chartBackground")
			.attr("width",chartInnerWidth)
			.attr("height",chartInnerHeight)
			.attr("transform",translate);

		//craete a scale to size bars proportionally to frame, also including the range and omain of the 
			//attribute value for creating incremnets
		var yScale=d3.scaleLinear()
			.range([463,0])
			.domain([0,16]);

		//set bars for each state
		var bars = chart.selectAll(".bar")
	        .data(csvData)
	        .enter()
	        .append("rect")
	        //this function sorts the bars based on the max to min order of the attribute values
	        .sort(function(a, b){
	            return b[expressed]-a[expressed]
	        })
	        //associte the bars to the commong field and thus could be correcty referenced
	        .attr("class", function(d){
	            return "bar " + d.adm1_code;
	        })
	        //devide the innner chart frame width evenly accoridng to the number of attributes 
	        .attr("width", chartInnerWidth / csvData.length - 1)
	        //define the x locations of the bars and add the left padding to shift the bars to the left
	        .attr("x", function(d, i){
	            return i * (chartInnerWidth / csvData.length) + leftPadding;
	        })
	        //define the height of the bars accoridng to the attribute value
	        .attr("height", function(d, i){
	            return 463 - yScale(parseFloat(d[expressed]));
	        })
	        //include the top and bottom paddinsg when claculating the y values of the bars
	        .attr("y", function(d, i){
	            return yScale(parseFloat(d[expressed])) + topBottomPadding;
	        })
	        //colroing the bars by calling the choropleth fucntion with attribute values and colorscale
	        .style("fill", function(d){
	            return choropleth(d, colorScale);
	        });


		//craete text elemnt for the chart title
		var  chartTitle =chart.append ("text")
			.attr("x", 300)
			.attr("y", 40)
			.attr("class","chartTitle")
			//this text string is not yet dynamic, could be dynamic with some ajustment by 
				//slciing and indexing the strings
			.text ("Unemployment rate of 16 years or older in 2010 by state");

		//create vertical axis generator
		var yAxis = d3.axisLeft()
        .scale(yScale);

	    //place axis by calling the previosuly defined axis generator
	    var axis = chart.append("g")
	        .attr("class", "axis")
	        .attr("transform", translate)
	        .call(yAxis);

	    //create frame for chart border
	    var chartFrame = chart.append("rect")
	        .attr("class", "chartFrame")
	        .attr("width", chartInnerWidth)
	        .attr("height", chartInnerHeight)
	        .attr("transform", translate);

		};

	//the follwoing blocks of code are from Mike Bostock's Radial Stacked Bar II example
		//this is not yet successfully integrated into the existing code yet. I will seek more help
		//and work on this furthur 
	/*function sunChart(csvData, colorScale){
		//this defines a variable to store the svg created for the sun-burst chart, or the radial stacked 
			//bar chart
		var sunChart=d3.select("body").append("svg"),
			sunChartWidth=+sunChart.attr(window.innerWidth*0.5),
			sunChartHeight=+sunChart.attr(960),
			innerRadius=180,
			outerRadius=Math.min(sunChartWidth,sunChartHeight)/2,
			g=sunChart.append("g").attr("transform","translate("+sunChartWidth/2+","+sunChartHeight/2+")");

		var x=d3.scaleBand()
			.range([0,2*Math.PI])
			.align(0);

		var y = d3.scaleRadial()
    		.range([innerRadius, outerRadius]);


		var z=d3.scaleOrdinal()
			.range([ "#ffffb2",
				"fecc5c",
				"fb8d3c",
				"f03b20",
				"bd0026"
			]);

		d3.csv("data/stateData.csv",function variables(d,i,columns){
			for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
			  d.total = t;
			  return d;
			}, function(error, data) {
			  if (error) throw error;


		  	x.domain(data.map(function(d) { return d.state; }));
		  	y.domain([0, d3.max(data, function(d) { return d.total; })]);
		  	z.domain(data.columns.slice(1));

		  g.append("g")
		    .selectAll("g")
		    .data(d3.stack().keys(data.columns.slice(1))(data))
		    .enter().append("g")
		      .attr("fill", function(d) { return z(d.key); })
		    .selectAll("path")
		    .data(function(d) { return d; })
		    .enter().append("path")
		      .attr("d", d3.arc()
		          .innerRadius(function(d) { return y(d[0]); })
		          .outerRadius(function(d) { return y(d[1]); })
		          .startAngle(function(d) { return x(d.data.state); })
		          .endAngle(function(d) { return x(d.data.state) + x.bandwidth(); })
		          .padAngle(0.01)
		          .padRadius(innerRadius));

		  var label = g.append("g")
		    .selectAll("g")
		    .data(data)
		    .enter().append("g")
		      .attr("text-anchor", "middle")
		      .attr("transform", function(d) { return "rotate(" + ((x(d.state) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; });

		  label.append("line")
		      .attr("x2", -5)
		      .attr("stroke", "#000");

		  label.append("text")
		      .attr("transform", function(d) { return (x(d.state) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; })
		      .text(function(d) { return d.state; });

		  var yAxis = g.append("g")
		      .attr("text-anchor", "middle");

		  var yTick = yAxis
		    .selectAll("g")
		    .data(y.ticks(5).slice(1))
		    .enter().append("g");

		  yTick.append("circle")
		      .attr("fill", "none")
		      .attr("stroke", "#000")
		      .attr("r", y);*/

		 /* yTick.append("text")
		      .attr("y", function(d) { return -y(d); })
		      .attr("dy", "0.35em")
		      .attr("fill", "none")
		      .attr("stroke", "#fff")
		      .attr("stroke-width", 5)
		      .text(y.tickFormat(5, "s"));

		  yTick.append("text")
		      .attr("y", function(d) { return -y(d); })
		      .attr("dy", "0.35em")
		      .text(y.tickFormat(5, "s"));

		  yAxis.append("text")
		      .attr("y", function(d) { return -y(y.ticks(5).pop()); })
		      .attr("dy", "-1em")
		      .text("Population");*/

		  /*var legend = g.append("g")
		    .selectAll("g")
		    .data(data.columns.slice(1).reverse())
		    .enter().append("g")
		      .attr("transform", function(d, i) { return "translate(-40," + (i - (data.columns.length - 1) / 2) * 20 + ")"; });

		  legend.append("rect")
		      .attr("width", 18)
		      .attr("height", 18)
		      .attr("fill", z);

		  legend.append("text")
		      .attr("x", 24)
		      .attr("y", 9)
		      .attr("dy", "0.35em")
		      .text(function(d) { return d; });


		});

	};*/
				
})();

