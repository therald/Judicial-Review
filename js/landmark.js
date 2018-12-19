class Landmark{
	constructor(parent, id, data){
		var viz = this;
		viz.id = id;
		viz.data = data.filter(function(d){ return d.issueAreaID !== "0"}); //remove the register for the parent inserted in pack
        viz.parent = parent;
        viz.div = d3.select(viz.parent);

        viz.curve = 0.8; //to draw curves

        // Get the total width and height from the div
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;

        viz.width = document.getElementById(parent.substring(1)).offsetWidth*.6;
        viz.height = 500//document.getElementById(parent.substring(1)).offsetHeight;
        viz.time = d3.timeParse("%m/%d/%Y"); 
        viz.createScales(viz);

        viz.filteredData = viz.data; 
        viz.update();

	}

	update(rangeStart, rangeEnd, issueAreas, beforeZoom){
		var viz = this; 
        viz.rangeStart = rangeStart;
        viz.rangeEnd = rangeEnd;
        viz.beforeZoom = beforeZoom;         
		if(rangeStart == undefined) viz.rangeStart = 1946;
		if(rangeEnd == undefined) viz.rangeEnd = 2018;
        if(issueAreas == undefined || (issueAreas[0] == 0 && beforeZoom == undefined)) viz.issueAreas = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14"];
        else if(issueAreas[0] !== "0"){ viz.issueAreas = issueAreas; }
        else if(issueAreas[0] == "0") viz.issueAreas = beforeZoom;  
        d3.select(viz.id).select("svg").remove();

		viz.createCanvas(viz);
		viz.filterData(viz); 
		viz.preprocessData();

	}

	filterData(viz){ 
		 
        if(viz.rangeStart == undefined) viz.rangeStart = 1946;
        if(viz.rangeEnd == undefined) viz.rangeEnd = 2018;
        if(viz.issueAreas[0] == 0) 
        if(viz.beforeZoom != undefined) viz.issueAreas = viz.beforeZoom;
        else viz.issueAreas = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14"];
        
		viz.filteredData = viz.data.filter(function(d,i){
			return ( viz.issueAreas.includes(d.issueAreaID) && d.declarationUncon > 1 && viz.time(d.dateDecision).getFullYear() >= viz.rangeStart && viz.time(d.dateDecision).getFullYear() <= viz.rangeEnd);
    		}) 
		
	}
	preprocessData(){ 
		var viz = this; 
		d3.csv("./data/landmark.csv", function(a){ 
			var join; 
            join = viz.join(a,viz.filteredData, "caseId", "caseId", function(m,lnd){
                return{
                    caseId: m.caseId,
                    landmark: (lnd !== undefined) ? 1:0,
                    description: (lnd !== undefined)? lnd.description: "",
                    dateDecision: m.dateDecision,
                    caseName: m.caseName
                }
            });//join 
   
        //show only landmarks 
      //   join = join.filter(function(d,i){ 
    		// return (  d.landmark ==1);
    		// }) 
        viz.addDomainsToScales(join);
        viz.draw(join);
		})//dataset
	}


	draw(data){
		var viz = this;
		var timeFormat = d3.timeFormat("%B %d, %Y")
		
            
        var isClicked = false;
 
        viz.svg.on("click",function(){isClicked = !isClicked;  d3.selectAll("path").classed("disable",isClicked); return isClicked})
            // .on("mouseleave",function(){
            //     $("#unconstitutionalCases").html("Unconstitutional Cases</br><span class='block_quote'>&quot;One function of legal rules is to create the legal positions that citizens hold and, perhaps, challenge as unconstitutional.&quot;<span class='block_quote_citation'>-From Cambridge English Corpus</span></span>");
            //     isClicked = false;
            //     d3.selectAll("path").classed("disable",isClicked);
            //     return isClicked;})

        var cases = viz.svg.append("g")
            .attr("stroke-opacity", .5).selectAll(".links")
            .data(data).enter();

        var curves = cases.append("path")
        	.attr("d", function(d,i){ return viz.get_path(d,i)})
        	
            .attr("stroke", function(d){return viz.cScale(d.landmark);})
        	.attr("stroke-width",function(d){if (data.length <10) return 3; else return 2})
        	.attr("fill","none") //important to avoid "close path effect"!
        	.style("cursor", "pointer")

        	.on("mouseover", function(d,i){
                if(!isClicked){
                    d3.select(this).attr("stroke-width",3)
                    if(d.landmark == 1){
                    // d3.select(this).classed("outlined", false)
                    d3.select(this).classed("highlightUncons", true);
                     }
                    else d3.select(this).classed("highlight", true);
                    var text = "Unconstitutional Cases </br>";
                    if(d.landmark == 1) text += "<span class='heading'>LANDMARK </span></br>";
                    text += "<span class= 'heading'>"+timeFormat(viz.time(d.dateDecision))+":</span></br><span class = 'caseName'> "+d.caseName+"</span></br><span class='caseDescription'>"+d.description+
                    "</span>";
                    $("#unconstitutionalCases").html(text);
                }

	        })

        	.on("mouseout", function(d){ 
                if(!isClicked)
                $("#unconstitutionalCases").html("Unconstitutional Cases</br><span class='block_quote'>&quot;One function of legal rules is to create the legal positions that citizens hold and, perhaps, challenge as unconstitutional.&quot;<span class='block_quote_citation'>-From Cambridge English Corpus</span></span>");
                d3.select(this).classed("highlight", false)
                d3.select(this).classed("highlightUncons", false)
        	})



	}

	createScales(viz){
		viz.cScale = d3.scaleSequential(d3.interpolateMagma)
    		.domain([-4, 4]);
    	viz.tScale = d3.scaleTime()
    		.rangeRound([0,viz.div.node().getBoundingClientRect().height]);
    	viz.y1Scale = d3.scaleLinear()
		    .range([0,viz.height*.005]);
		viz.y2Scale = d3.scaleLinear()
			.range([viz.height*.3,0]); 
	}//createScales

	addDomainsToScales(data){
		var viz = this;
		
		var minMaxt = d3.extent(data.map(function(d){ return viz.time(d.dateDecision); }));
		var minMaxID = d3.extent(data.map(function(d,i){return i}))
		viz.tScale.domain(minMaxt); 
		viz.y1Scale.domain(minMaxID);
		viz.y2Scale.domain(minMaxID);
	}

	//based on http://csclub.uwaterloo.ca/~n2iskand/?page_id=13
    get_path(d,i) { 
    	var viz = this;
        var x0 = 0;									//initial x point
        var x1 = viz.width;						//first x stop
        var xi = d3.interpolateNumber(x0, x1);
        var x2 = xi(viz.curve);
        var x3 = xi(1 - viz.curve);					//to generate an s curve
        var y0 = viz.tScale(viz.time(d.dateDecision));	//initial y point
        var y1 = viz.div.node().getBoundingClientRect().height/2;				//first y stop
        var x4 = viz.width;

        return "M" + x0 + "," + y1
            + "C" + x2 + "," + y1
            + " " + x3 + "," + y0
            + " " + x1 + "," + y0
   
    } // get_path

    createCanvas(viz){
		viz.svg = d3.select(viz.id)
		    .append("svg")
		    .attr("width", "100%")
		    .attr("height", "100%")
		    .attr("viewBox", "0 0 " +" " + viz.width + " " + viz.div.node().getBoundingClientRect().height) //change
            .attr("preserveAspectRatio", "xMinYMin")
            

	}//createCanvas

	//http://learnjsdata.com/combine_data.html
    join(lookupTable, mainTable, lookupKey, mainKey, select) {
        
        var l = lookupTable.length,
            m = mainTable.length,
            lookupIndex = [],
            output = [];
        for (var i = 0; i < l; i++) { // loop through l items
            var row = lookupTable[i];
            lookupIndex[row[lookupKey]] = row; // create an index for lookup table
        }
        for (var j = 0; j < m; j++) { // loop through m items
            var y = mainTable[j]; 
            var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
            
            output.push(select(y, x)); // select only the columns you need
            
        }

        return output;
    };
}