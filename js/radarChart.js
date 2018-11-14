//based on https://bl.ocks.org/alandunning/4c36eb1abdb248de34c64f5672afd857
class  RadarChart {
	constructor(id, data, options, totalCases) {
        var viz = this;
        viz.id = id;
        viz.totalCases = totalCases;


        viz.data = data;
        viz.cfg = { //values by default
		     radius: 0,
		     w: 600,
     		 h: 600,
		     factor: 1,
		     factorLegend: .85,
		     levels: 3, 
		     maxValue: 0,
		     radians: 2 * Math.PI,
		     opacityArea: 0,
		     ToRight: 5,
		     TranslateX: 0,
		     TranslateY: 0,
		     ExtraWidthX: 50,
		     ExtraWidthY: 40,
		     color: d3.scaleOrdinal().range(["blue", "#CA0D59"])
	    };

	    if('undefined' !== typeof options){
			for(var i in options){ 
				if('undefined' !== typeof options[i]){
				    viz.cfg[i] = options[i];
				 }
			}
		}

		//read axis names
		viz.allAxis = data.map(function(d){
			if(d.key !== "null") return d.key
        })
        // console.log(viz.allAxis)

		
		viz.draw(data);
	    


	    
    }

    draw(d){
    	var viz = this;
    	var id = viz.id;
    	var allAxis = viz.allAxis;
    	var cfg = viz.cfg;
    	var total = viz.allAxis.length;
	    var radius = viz.cfg.factor*Math.min(viz.cfg.w/2, viz.cfg.h/2);
	    var Format = d3.format('.0%');
	    d3.select(id).select("svg").remove();

	    var g = d3.select(id)
		    .append("svg")
		    .attr("width", viz.cfg.w+viz.cfg.ExtraWidthX)
		    .attr("height", viz.cfg.h+viz.cfg.ExtraWidthY)
		    .append("g")
		    .attr("transform", "translate(" + viz.cfg.TranslateX + "," + viz.cfg.TranslateY + ")");

		//Circular segments
		for(var j = 0; j < viz.cfg.levels; j++){
		 // var levelFactor = viz.cfg.factor*radius*(1+Math.log((j+1))/viz.cfg.levels);
		  var levelFactor = viz.cfg.factor*radius*(j+1)/viz.cfg.levels;
		//  console.log((j+1)/viz.cfg.levels);
		//  console.log(1+Math.log((j+1)/viz.cfg.levels)/Math.log(10))
		  g.selectAll(".levels")
			   .data(allAxis)
			   .enter()
			   .append("svg:line")
			   .attr("x1", function(d, i){return (levelFactor*(1-viz.cfg.factor*Math.sin(i*viz.cfg.radians/total)));})
			   .attr("y1", function(d, i){return (levelFactor*(1-viz.cfg.factor*Math.cos(i*viz.cfg.radians/total)));})
			   .attr("x2", function(d, i){return (levelFactor*(1-viz.cfg.factor*Math.sin((i+1)*viz.cfg.radians/total)));})
			   .attr("y2", function(d, i){return (levelFactor*(1-viz.cfg.factor*Math.cos((i+1)*viz.cfg.radians/total)));})
			   .attr("class", "line")
			   .style("stroke", "gray")
			   .style("stroke-opacity", "0.75")
			   .style("stroke-width", "0.3px")
			   .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
		}

		//Text  % per level
	    for(var j=0; j<viz.cfg.levels; j++){
	      //var levelFactor = 2*viz.cfg.factor*radius*(Math.log(2.4*(j+1))/viz.cfg.levels);
	      var levelFactor = viz.cfg.factor*radius*((j+1))/viz.cfg.levels;

	      g.selectAll(".levels")
		       .data([1]) //dummy data
		       .enter()
		       .append("svg:text")
		       .attr("x", function(d){return levelFactor*(1-viz.cfg.factor*Math.sin(0));})
		       .attr("y", function(d){return levelFactor*(1-viz.cfg.factor*Math.cos(0));})
		       .attr("class", "legend")
		       .style("font-family", "sans-serif")
		       .style("font-size", "8px")
		       .attr("transform", "translate(" + (viz.cfg.w/2-levelFactor + viz.cfg.ToRight) + ", " + (viz.cfg.h/2-levelFactor) + ")")
		       .attr("fill", "#737373")
		      // .text((j+1)*100/viz.cfg.levels); //without %
		       .text(Format((j+1)*viz.cfg.maxValue/100/viz.cfg.levels));
	    }


	    //draw axis
	    var axis = g.selectAll(".axis")
	        .data(allAxis)
	        .enter()
	        .append("g")
	        .attr("class", "axis");

	    axis.append("line")
		    .attr("x1", cfg.w/2)
		    .attr("y1", cfg.h/2)
		    .attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
		    .attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
		    .attr("class", "line")
		    .style("stroke", "grey")
		    .style("stroke-opacity", "0.75")
		    .style("stroke-width", "1px");

    	//draw unconstitutional cases
	    var unconst = g.selectAll(".unconstitutional")
	        .data(d, function(j, i){return j;})//j.value.unconstCases*100/j.value.countCases})
	        .enter()
	        .append("g")
	        .attr("class", "axis");

	    unconst.append("line")
		    .attr("x1", (cfg.w/2))
		    .attr("y1", (cfg.h/2))
		    .attr("x2", function(d, i){
				// console.log(d.value.unconstCases/d.value.countCases);
				return cfg.w/2*(1-((d.value.unconstCases/d.value.countCases)*cfg.factor*Math.sin(i*cfg.radians/total)));
			})
		    .attr("y2", function(d, i){
				// console.log(Math.log(d.value.unconstCases/d.value.countCases));
				return cfg.h/2*(1-((d.value.unconstCases/d.value.countCases)*cfg.factor*Math.cos(i*cfg.radians/total)));
			})
		    .attr("class", "line")
		    .style("stroke", "red")
		    .style("stroke-opacity", "0.5")
		    .style("stroke-width", "3px");

		//text axis
		// axis.append("text")
		//     .attr("class", "legend")
		//     .text(function(d){ return textProcessing(d)}) //return d})
		//     .style("font-family", "sans-serif")
		//     .style("font-size", "11px")
		//     .attr("text-anchor", "middle")
		//     .attr("dy", "1.5em")
		//     .attr("transform", function(d, i){return "translate(0, -10)"})
		//     .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
		//     .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

		var text = axis.append("text")
			
		    .attr("class", "legend")
		    .style("font-family", "sans-serif")
		    .style("font-size", "11px")
		    .attr("text-anchor", "middle")
		    .attr("transform", function(d, i){return "translate(0, -25)"})
		    .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
		    .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

		text.append("tspan")
			//.attr("transform", function(d, i){return "translate(0, -10)"})
			.attr("dy", "1.5em")
			.text(function(d){ return textProcessing(d,0)}) //return d})
		text.append("tspan")
			.attr("dx", function(d) { return -38; })
			.attr("dy", "1.5em")
			.text(function(d){ return textProcessing(d,1)}) //return d})

		//draw data
		var dataValues = []; 
		var temp = g;
		// console.log(dataValues);
		g.selectAll(".nodes")
			.data(d, function(j, i){
				// console.log(j.value.countCases/viz.totalCases*100);
				dataValues.push([
		        cfg.w/2*(1-(parseFloat(Math.max(3.1*Math.log(j.value.countCases/viz.totalCases*100), 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
		        cfg.h/2*(1-(parseFloat(Math.max(3.1*Math.log(j.value.countCases/viz.totalCases*100), 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
		        ]);})

		g.selectAll(".area")
	         .data([dataValues])
	         .enter()
	         .append("polygon")
	         .attr("class", "radar-chart-serie")
	         .style("stroke-width", "2px")
	         .style("stroke", cfg.color(0))
	         .attr("points",function(d) {
	           var str="";
	           for(var pti=0;pti<d.length;pti++){
	             str=str+d[pti][0]+","+d[pti][1]+" ";
	           }
	           return str;
	          })
	         .style("fill", function(j, i){return cfg.color(0)})
	         .style("fill-opacity", cfg.opacityArea)
		//d.forEach(function(y, x){
		
      		 
   //    		g.selectAll(".nodes")
   //    			.data(y.value, function(j, i){ console.log("test"); 
		 //        dataValues.push([
		 //        cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
		 //        cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
		 //        ]);
		 //     });
      		// console.log(dataValues);
		   // dataValues.push(dataValues[0]);
		  /*  g.selectAll(".area")
	             .data([dataValues])
	             .enter()
	             .append("polygon")
	             .attr("class", "radar-chart-serie")
	             .style("stroke-width", "2px")
	             .style("stroke", cfg.color(series))
	             .attr("points",function(d) {
	               var str="";
	               for(var pti=0;pti<d.length;pti++){
	                 str=str+d[pti][0]+","+d[pti][1]+" ";
	               }
	               return str;
	              })
	             .style("fill", function(j, i){return cfg.color(0)})
	             .style("fill-opacity", cfg.opacityArea)
	             .on('mouseover', function (d){
	                      z = "polygon."+d3.select(this).attr("class");
	                      g.selectAll("polygon")
	                       .transition(200)
	                       .style("fill-opacity", 0.1); 
	                      g.selectAll(z)
	                       .transition(200)
	                       .style("fill-opacity", .7);
	                      })
	             .on('mouseout', function(){
	                      g.selectAll("polygon")
	                       .transition(200)
	                       .style("fill-opacity", cfg.opacityArea);
	             });*/
    		//});



    	function textProcessing(text, i){
    		text = text.split(" ");
    		return text[i];
    	}
    }
}