class  Pack { 
	
	constructor(parent, id, landmark) {
		var viz = this;
		
        viz.id = id;
        viz.parent = parent;
        // viz.totalCases = totalCases;
        viz.div = d3.select(viz.parent);
        viz.landmark = landmark;
        // Get the total width and height from the div
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;

        // d3 margin convention
        viz.width = 500//document.getElementById(parent.substring(1)).offsetWidth;
        viz.height = document.getElementById(parent.substring(1)).offsetHeight;
        viz.color = d3.scaleSequential(d3.interpolateMagma)
    		.domain([-4, 4]);
        
        
 
        
		
        
	}
	
	update(data, rangeStart,rangeEnd,issueAreas){ //filtered data
		var viz = this;
		viz.rangeStart = rangeStart;
		viz.rangeEnd = rangeEnd;
		if(issueAreas != undefined) viz.issueAreas = issueAreas;
		//add root
		data[data.length]={key:"root",value:{countCases: 1, issueAreaID: "0", unconstCases: 0}}
		d3.select(viz.id).select("svg").remove();
		document.getElementById("innerCircle").innerHTML="";

  		viz.createCanvas(viz);
        viz.computePositions(data);
        viz.draw(viz);
	    
	}

	//Find positions for circles
	computePositions(data){
		var viz = this;
		var side = viz.width*.4;
		var pack = d3.pack()
		    .size([side, side])
		    .padding(3);

		var stratify = d3.stratify()
			.id(function(d) { return d.key; })
	    	.parentId(function(d) {  return d.value.parent})

	    viz.root = stratify(data)
	      .sum(function(d) { return d.value.countCases; })
	    pack(viz.root);
	    
	}

	createCanvas(viz){
		var side = d3.min(viz.height, viz.width)
		viz.svg = d3.select(viz.id)
		    .append("svg")
		    .attr("width", "100%")
		    .attr("height", "50%")
		    .attr("viewBox", -250+" "+(-250)+" " + viz.width + " " + 500) //change
            .attr("preserveAspectRatio", "xMinYMin")
            .style("display", "block")
            // .attr("transform","translate(40 0)")

	}

	//Based on https://beta.observablehq.com/@mbostock/d3-zoomable-circle-packing#pack
	// and http://bl.ocks.org/pnavarrc/20950640812489f13246
	draw(viz){

		viz.svg//.style("background", viz.color(0))
	        .style("cursor", "pointer")
		    .on("click", function(d) { return zoom(viz.root)})
	    viz.focus = viz.root;

  		var view;

  		

		//# of unconstitutional cases and total number of cases per issue area
		
		//sets of unconstitutional cases
		var uncons = viz.svg.append("g")
		    .selectAll("innerCircle")
		    .data(viz.root.descendants().slice(1))
		    .enter().append("circle")
		    .attr("class", function(d) { return "fill_" + d.data.value.issueAreaID })
		    .attr("opacity",.5)

		      .on("click", function(d){  return(focus !== d && (zoom(d)) || d3.event.stopPropagation())})

		//sets for each issue area
  		var node = viz.svg.append("g")
		    .selectAll("circle")
		    .data(viz.root.descendants().slice(1))
		    .enter().append("circle")

		      .attr("class", function(d) { return "fill_" + d.data.value.issueAreaID })
		      .style("opacity",1)
		      .on("click", function(d){ return(focus !== d && (zoom(d)) || d3.event.stopPropagation())})

		//name os issue area
		var label = viz.svg.append("g")
		    .style("font", "sans-serif")
		    .attr("pointer-events", "none")
		    .attr("text-anchor", "middle")
		    .style("fill","white")
		    .selectAll("text")
		    .data(viz.root.descendants())
		    .enter().append("text")
		      // .style("fill-opacity", d => d.parent === viz.root ? 1 : 0)
		      .style("fill-opacity",0)
		      .style("display", d => d.parent === viz.root ? "inline" : "none")
		      .text(function(d){ return d.data.key});
		
		//curve
		
		var arch = viz.svg.append("path")
			.attr("id", "curvedTextPath")
			.attr("stroke", "red")
        	.attr("stroke-width",2)
        	.attr("fill","none")
        	.style("opacity",0);
		var txtArch =  viz.svg.append("text")
			.append("textPath")
	        .attr("startOffset", "50%")
	        .attr("xlink:href", "#curvedTextPath")
	        .style("text-anchor","middle")
	        .attr("class", "curvedText")
	        .style("opacity",1)

		//center focus
		zoomTo([viz.root.x, viz.root.y, viz.root.r * 2]);
		node.exit().remove();
		uncons.exit().remove();
		label.exit().remove();

		function zoomTo(v) { 
		    const k = viz.width / v[2]; 

		    view = v;

		    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
		    
		    uncons.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
		    uncons.attr("transform", function(d) {
		    	var phase = 0//(d.r)*(1-(d.data.value.unconstCases/d.data.value.countCases))*.8;
		    	return `translate(${(d.x - v[0])* k},${(d.y - v[1] ) * k})` })
		    uncons.attr("r", function(d) { return  d.r*k})//(k*d.r)*d.data.value.unconstCases/d.data.value.countCases })//5/d.r*d.data.value.unconstCases*k})
  			node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
		    node.attr("r", d => d.r * k - (k*d.r)*d.data.value.unconstCases/d.data.value.countCases);
		    
		 	
  		}//end zoomTo

  		function zoom(d) { 
  			viz.landmark.update((viz.rangeStart != undefined) ? viz.rangeStart: "1946", (viz.rangeEnd != undefined) ? viz.rangeEnd:"2018", [d.data.value.issueAreaID], viz.issueAreas); 
		    focus = d;
	        arch.attr("d",getPath(d))
			
		        	

		    const transition = viz.svg.transition()
		        .duration(d3.event.altKey ? 7500 : 750)
		        .tween("zoom", d => {
		          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]); 
		          document.getElementById("innerCircle").innerHTML="";
		          txtArch.style("opacity",0);
		          return t => zoomTo(i(t));
		        });

		    label
		      .filter(function(t) { return t.parent === focus || this.style.display === "inline"; })
		      .transition(transition)		        
		        .on("start", function(t) { if (t.parent == focus) {
		        	
		        	this.style.font="10px sans-serif";
		        	d3.select(this).style("fill-opacity",0);
		
		        	document.getElementById("innerCircle").innerHTML="";
		        	txtArch.style("opacity",0);
		        	} })
		        .on("end", function(t) { 
		        	if (t.parent !== focus) {
		        		
		        		this.style.font="30px sans-serif";
		        		if(d == t) { 
		        			d3.select(this).style("fill-opacity",1);
		        			arch.attr("d",getPath(t))
		        			// txtArch.attr("opacity",1)
		        			txtArch.text("Unconstitutional Cases: "+(d.data.value.unconstCases));
		        		}
		        		txtArch.style("opacity",1)
			       		document.getElementById("innerCircle").innerHTML="Total: <span>" + d.data.value.countCases + " cases </span>";
			        	document.getElementById("innerCircle").style.color = "#EEE";
			        	

			  
			        }
			        	
		        } )
		     //end label
  		}//end zoom

  		       

  		//bassed on http://bl.ocks.org/jebeck/196406a3486985d2b92e
  		function getPath(d){ 
	        var r1 = viz.width/2;
	        var r = 0.99*(r1 - r1*d.data.value.unconstCases/d.data.value.countCases);
	        var startX =  -r;
	        var startY =  0;
	        return 'm' + startX + ',' + startY + ' ' +
	          'a' + r + ',' + r + ' 0 0 0 ' + (2*r) + ',0';
  		}
	}
	
}