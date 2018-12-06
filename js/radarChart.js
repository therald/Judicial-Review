//based on https://bl.ocks.org/alandunning/4c36eb1abdb248de34c64f5672afd857
class  RadarChart {
	constructor(parent, id, options, totalCases, bar) {
        var viz = this;


        viz.id = id;
        viz.parent = parent;
        viz.totalCases = totalCases;
        viz.bar = bar;

        // viz.data = data;
        // viz.filteredData = data;
        viz.cfg = { //values by default
		     radius: 2,
		     w: 600,
     		 h: 600,
		     factor: 1,
		     factorLegend: .85,
		     levels: 3, 
		     maxValue: 0,
		     radians: 2 * Math.PI,
		     opacityArea: 0.4,
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

		//viz.cScale = d3.scaleOrdinal(d3.schemeCategory20);
		viz.cScale = d3.scaleOrdinal()
	      .domain([0,1,2,3,4,5,6,7,8,9,10,11,12,13])
	      .range(d3.schemeCategory20);

	    
    }

    update(data, options, totalCases, precedent){
    	var viz = this;
    	viz.data = data;
    	viz.precedent =precedent;
    	if (totalCases) viz.totalCases = totalCases;

    	 if('undefined' !== typeof options){
			for(var i in options){ 
				if('undefined' !== typeof options[i]){
				    viz.cfg[i] = options[i];
				 }
			}
		}

    	//read axis names
		viz.allAxis = viz.data.map(function(d){
			if(d.key !== "null") return d.key
        })
        // console.log(viz.allAxis)

		
		viz.value = viz.draw(viz.data);
		$("#legend").text("");
    }

    getArea(){
    	var viz = this;
    	return viz.value;
    }

    draw(d){
    	var viz = this;
    	var id = viz.id;
    	viz.area = 100;
    	var allAxis = viz.allAxis;
    	var cfg = viz.cfg;
    	var total = viz.allAxis.length;
	    var radius = viz.cfg.factor*Math.min(viz.cfg.w/2, viz.cfg.h/2);
	    var Format = d3.format('.0%');
	    d3.select(id).select("svg").remove();

	    viz.div = d3.select(viz.parent);

	    // Get the total width and height from the div
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;

	    var g = d3.select(id)
		    .append("svg")
		    .attr("width", "100%")//viz.cfg.w+viz.cfg.ExtraWidthX)
		    .attr("height", "100%")//viz.cfg.h+viz.cfg.ExtraWidthY)
		    .attr("viewBox", "0 0 " + viz.totalWidth + " " + viz.totalHeight)
            .attr("preserveAspectRatio", "xMinYMin")
		    .append("g")
		    .attr("transform", "translate(" + viz.cfg.TranslateX + "," + viz.cfg.TranslateY + ")");

		//Circular segments
		for(var j = 0; j < viz.cfg.levels; j++){
		  var levelFactor = viz.cfg.factor*radius*(j+1)/viz.cfg.levels;
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
		       .style("font-size", "12px")
		       .attr("transform", "translate(" + (viz.cfg.w/2-levelFactor + viz.cfg.ToRight) + ", " + (viz.cfg.h/2-levelFactor*0.9) + ")")
		       .attr("fill", "black")
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

    
		var bbox = [];

		var text = axis.append("text")
			
		    
		    .style("font-family", "sans-serif")
		    .style("font-size", "15px")
		    .attr("text-anchor", "middle")
		    .attr("transform", function(d, i){return "translate(0, -25)"})
		    .attr("x", function(d, i){ return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
		    .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-24*Math.cos(i*cfg.radians/total);})
		    .attr("class", "btn")
		    

		var shift = -38;
		text.append("tspan")
			//.attr("transform", function(d, i){return "translate(0, -10)"})
			.attr("dy", "1.5em")
			.text(function(d){ return textProcessing(d,0)}) //return d})
		text.append("tspan")
			.attr("dx", function(d) { return shift; })
			.attr("dy", "1.5em")
			.text(function(d){ return textProcessing(d,1)}) //return d})

		//draw rectangles as background
		
		axis.selectAll("text").each(function(d,i) {
        bbox.push(this.getBBox()); // get bounding box of text field and store it in texts array
    	});

		var rect = g.selectAll("rect")
			.data(bbox).enter().append("rect")
		    rect.attr("x", function(d){return d.x-3})
		    .attr("y", function(d){return d.y-3})
		    .attr("width", function(d){return d.width+6})
		    .attr("height", function(d){return d.height+6})
		    //.attr("class", "btn")
		   // .style("fill", "blue")
		    .style("opacity", "0")
		    // .style("stroke", "#666")
		    // .style("stroke-width", "1.5px")
		    .attr("transform", "translate(" + (0) + "," + (-25) + ")")
		    .on("mouseover", function(t,i){ var elem = d3.select(this); 
		    	if(d3.select(this).style("opacity") == 0){
		    	elem.classed("btn",true)
	            elem.transition().duration(200).style("opacity", .4)
	            elem.style("fill", viz.cScale(d[i].value.issueAreaID));        
            }
		    })
		    .on("mouseout", function(d){
		    	var elem = d3.select(this);
		    	elem.transition().duration(200).style("opacity", 0);  
		    	elem.classed("btn",false)
		    })
		    .on("click", function(t,i){
		    	var elem = d3.select(this); 
		    	elem.classed("btnBorder",true); 
		    	elem.style("stroke", "#666"); 
		    	elem.style("stroke-width", "1.5px"); 
		    	viz.area = d[i].value.unconstCases/d[i].value.countCases; 
		    	viz.bar.update(viz.area*100, d[i].value.issueAreaID);
		    	$("#legend").text("% "+d[i].key);
		    	//viz.precedent.filterByIssueArea(d[i].value.issueAreaID)
		    })



		//draw data
		var dataValues = []; 
		var temp = g;
		// console.log(dataValues);
		g.selectAll(".nodes")
			.data(d, function(j, i){
				// console.log(j.value.countCases/viz.totalCases*100);
				dataValues.push([
		        cfg.w/2*(1-(parseFloat(Math.max((j.value.countCases/viz.totalCases*100), 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
		        cfg.h/2*(1-(parseFloat(Math.max((j.value.countCases/viz.totalCases*100), 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
		        ]);})
		var z;
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
				 });
	
    	var tooltip = d3.select("body").append("div").attr("class", "toolTip");
		   //	 d.forEach(function(y, x){
		    g.selectAll(".nodes")
		     .data(d).enter()
		     .append("svg:circle")
		    //  .attr("class", "radar-chart-serie"+series)
		     .attr('r', cfg.radius)
		     .attr("alt", function(j){return Math.max(j.value.countCases, 0)})
		     .attr("cx", function(j, i){
		      	return cfg.w/2*(1-(Math.max(j.value.countCases/viz.totalCases*100, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
		      })
		     .attr("cy", function(j, i){ 
		        return cfg.h/2*(1-(Math.max(j.value.countCases/viz.totalCases*100, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
		      })
		     .attr("data-id", function(j,i){return i})
		     .style("fill", "#fff")
		     .style("stroke-width", "2px")
		     .style("stroke", "blue").style("fill-opacity", .9)
		     .on('mouseover', function (d){
		            tooltip
		              .style("left", d3.event.pageX - 40 + "px")
		              .style("top", d3.event.pageY - 80 + "px")
		              .style("display", "inline-block")
		      				.html((d.key) + "<br><span>" + Format(d.value.countCases/viz.totalCases) + "</span>");
		            })
		    .on("mouseout", function(d){ tooltip.style("display", "none");});

		     // series++;
		   // });
    


    	function textProcessing(text, i){
    		text = text.split(" "); //console.log(text[i].node().getComputedTextLength())
    		return text[i];
    	}

    	return viz.area*100;

    }
}