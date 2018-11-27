class  Bar {
	constructor(parent, id) {
        var viz = this;


        viz.id = id;
        viz.parent = parent;
        viz.padding = 40;


        //viz.data = data;
        viz.cfg = { //values by default
		     w: 60,
     		 h: 600,
		     factor: 1,
		     factorLegend: .85,
		     ToRight: 5,
		     TranslateX: 95,
		     TranslateY: 0,
		     color: d3.scaleOrdinal().range(d3.schemeCategory20)
	    };

	    viz.div = d3.select(viz.parent); 
	    // // Get the total width and height from the div
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;
		
		viz.yScale = d3.scaleLinear()
			// .domain([ 0, 100 ])
			// .range([ viz.padding, viz.totalHeight*4 - viz.padding ]);
			.domain([ 0, 100 ])
			.range([ viz.totalHeight*3 - viz.padding, viz.padding  ]);
		// define the y axis
		//var values = [0,10,20,30,40,50,60,70,80,90,100]
		viz.yAxis = d3.axisLeft()
	        .scale(viz.yScale);

	    viz.cScale = d3.scaleOrdinal(d3.schemeCategory20);
	    
    }

    update(data, areaID){
    	var viz = this;
    	//viz.data = data;
    	viz.draw(data,areaID);
    }

    draw(d, areaID){
    	var viz = this;
    	var id = viz.id;
    	var cfg = viz.cfg;
	    var Format = d3.format('.0%');
	   d3.select(viz.id).select("svg").remove();
        


	    var g = d3.select(id)
		    .append("svg")
		    .attr("width", "100%")
		    .attr("height", "100%")
		   // .attr("viewBox","0 0 100 100")
		    .attr("viewBox", "0 0 " + viz.totalWidth + " " + viz.totalHeight)
            .attr("preserveAspectRatio", "xMinYMin")
		    .append("g")
		    .attr("transform", "translate(" + viz.cfg.TranslateX + "," + viz.cfg.TranslateY + ")")

	   var unconst = g//g.select("rect")
		    // .data(d, function(j, i){console.log(j); return j;})//j.value.unconstCases*100/j.value.countCases})
		    // .enter()
		    .append("rect")
		   // .attr("class", "bar")
		    .attr("x",cfg.TranslateX)//viz.totalWidth/2)
		    .attr("y",(viz.totalHeight*3)-viz.yScale(100-d)+cfg.TranslateY)
		   // .attr("y",viz.padding)
		    .attr("width",60)
		    .attr("height", viz.yScale(104-d)) //to avoid showing a bar when it is 0
		    .style("fill", viz.cScale(areaID))
		    .style("opacity",1)
		    
		    g.append("g")
		    .call(d3.axisLeft(viz.yScale))
		    .attr("class", "axisUnconst")
		    // .call(d3.axisLeft(viz.yScale).ticks(10, "%"))
		    .attr("transform", "translate(" + viz.cfg.TranslateX + "," + viz.cfg.TranslateY + ")")
		    g.append("text")
		    	.attr("class", "axisUnconst")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate("+ (viz.cfg.TranslateX*0.001) +","+(viz.totalHeight*1.5)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
                .text("Unconstitutional Rulings");
		     //  .attr("x",cfg.TranslateX)//viz.totalWidth/2)
		    	// .attr("y",(viz.totalHeight*4)-viz.yScale(100-d)+cfg.TranslateY)
		     // // .attr("y", 140)
		     //  .attr("dy", "-0.71em")
		     //  .attr("text-anchor", "middle")
		     //  .text(d)
		     //  .attr("transform", "translate(" + viz.cfg.TranslateX + "," + viz.cfg.TranslateY + ")")
		     //  .attr("class", "axisUnconst")
		   // .style("fill", "black")

		
    }
}