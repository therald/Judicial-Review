class Constitutional {
    constructor(div, data) {
        var viz = this;

        // Variable to see if the vizualization is "active", whatever that means
        // in the context of the viz
        viz.active = false;
        viz.div = d3.select(div);
        viz.name = div;

        viz.radar;
        viz.value;
        viz.bar;

        // Get the total width and height from the div
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;

        //set range to all years by default
        viz.rangeStart = 1946;
        viz.rangeEnd = 2018;

        
        // d3 margin convention
        viz.margin = { top: 10, bottom: 0, left: 10, right: 10 };
        // viz.width = viz.totalWidth - viz.margin.left - viz.margin.right;
        // viz.height = viz.totalHeight - viz.margin.top - viz.margin.bottom;
        // d3 margin convention
        viz.width = document.getElementById(div.substring(1)).offsetWidth;
        viz.height = document.getElementById(div.substring(1)).offsetHeight;
  
        viz.data = data;
        viz.filteredData = data;
        viz.update();
    }

    update(rangeStart, rangeEnd, issueAreas){
        var viz = this;
        viz.issueAreas;
        viz.rangeStart;
        viz.rangeEnd;
        //viz.data.filter(function(d){ console.log(d.dateDecision)})
        if(rangeStart != undefined) {
            viz.rangeStart = rangeStart;
            viz.rangeEnd = rangeEnd;
            viz.issueAreas = issueAreas;
            viz.filterData(); console.log(viz.filteredData)
            viz.preprocessData(1);
        }
        
        else
        viz.preprocessData(0);
    }

    filterData(){ 
        var viz = this;
        console.log(viz.issueAreas)
    // Filter data depending on selected time period (brush)
        var year = d3.timeParse("%m/%d/%Y"); 
        viz.filteredData = viz.data.filter(function(d){ 
        return (viz.issueAreas.includes(d.issueArea) && year(d.dateDecision).getFullYear() >= viz.rangeStart && year(d.dateDecision).getFullYear() <= viz.rangeEnd);
    }) 
    }

    draw(data, update, dataL){ 
        var viz = this;
        
        if (update == 0){
            // viz.bar = new Bar(viz.name, "#bar");
            // viz.bar.update(0);
            // viz.radar = new RadarChart(viz.name, "#radar",  config, viz.totalCases, viz.bar);
            // viz.radar.update(data); 

             
            viz.landmark = new Landmark(viz.name, "#landmark", dataL);
            viz.pack = new Pack(viz.name, "#pack", viz.landmark); 
            viz.pack.update(data); 
            // viz.landmark.update(dataL);
 
        }else{ 
            // viz.radar.update(data, config, viz.totalCases, viz.precedent);

            // viz.bar.update(0);
            viz.pack.update(data, viz.rangeStart,viz.rangeEnd,viz.issueAreas);
            viz.landmark.update(viz.rangeStart,viz.rangeEnd, viz.issueAreas);
        }
        
       
    }

    preprocessData(update) {
        var viz = this;
        // console.log(viz.data);
        //attributes to be used d.issueArea, d.declarationUncon, caseId, dateDecision
        //percentage of cases ruled unconstitutional
        viz.totalCases = viz.filteredData.length;
        d3.csv("./data/issue_area.csv", function(a){ 
            var join; 
            join = viz.join(a,viz.filteredData, "id", "issueArea", function(m,iss){
                return{
                    caseId: m.caseId,
                    issueArea: (iss !== undefined) ? iss.IssueAreaName : null,
                    issueAreaID:(m != undefined) ? m.issueArea : null,
                    declarationUncon: m.declarationUncon,
                    dateDecision: m.dateDecision,
                    caseName: m.caseName,
                    descritionArea: (iss != undefined) ? iss.description : null,
                    parent: "0"
                }
            });//join

            //filter join to remove missing issueArea
            join = join.filter(function(d) { return d.issueArea !== null; });
            join[join.length]= {issueAreaID:"0"};


            //group by issueArea
            var dataByIssueArea = d3.nest()
                .key(function(d){return d.issueArea})
                .rollup(function(v){  return{ 
                    countCases: v.length,
                    issueAreaID: v[0].issueAreaID,
                    parent: "root",
                    unconstCases: d3.sum(v, function(d){
                        if( parseInt(d.declarationUncon) !== 1) return 1//parseInt(d.declarationUncon)
                            else return 0})

                    

                };

                })
                .entries(join); 
           viz.draw(dataByIssueArea, update, join);
            

            //join 
        }); //d3.csv
        

    }
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
}// end class