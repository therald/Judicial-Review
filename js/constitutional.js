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

    update(rangeStart, rangeEnd, precedent){
        var viz = this;
        viz.precedent = precedent;
        //viz.data.filter(function(d){ console.log(d.dateDecision)})
        if(rangeStart != undefined) {
            viz.rangeStart = rangeStart;
            viz.rangeEnd = rangeEnd;
            viz.filterData(rangeStart, rangeEnd);
            viz.preprocessData(1);
        }
        
        else
        viz.preprocessData(0);
    }

    filterData(rangeStart, rangeEnd){
        var viz = this;

    // Filter data depending on selected time period (brush)
        var year = d3.timeParse("%m/%d/%Y");
        viz.filteredData = viz.data.filter(function(d){ 
        return (year(d.dateDecision).getFullYear() >= rangeStart && year(d.dateDecision).getFullYear() <= rangeEnd);
    })
    }

    draw(data, update, precedent){
        var viz = this;
        var max = d3.max(data.map(function(d){return d.value.countCases; }))/viz.totalCases*100;
        // console.log(Math.min(Math.ceil(max/10)*10+10,100))    
       // var side = Math.min(viz.width-viz.margin.left-viz.margin.right, viz.height-viz.margin.top-viz.margin.bottom)
        var side = Math.min(viz.width*.6-viz.margin.left, viz.height-viz.margin.top*4)
        // console.log(side)
        var config = {
            w: side*.9,
            h: side*.9,
            maxValue: Math.min(Math.ceil(max)+1,100),
            levels: 5,
            TranslateX: viz.width/4,//viz.margin.left*8,//viz.width*.2,
            TranslateY: viz.margin.top*4,//viz.height/7,
           ExtraWidthX: viz.width*.5,
           ExtraWidthY: 1*viz.height,//viz.height,

        }
        
        if (update == 0){
            viz.bar = new Bar(viz.name, "#bar");
            viz.bar.update(0);
            viz.radar = new RadarChart(viz.name, "#radar",  config, viz.totalCases, viz.bar);
            viz.radar.update(data); 
            // viz.value = viz.radar.getArea();
            
            // viz.bar.update(viz.value);
        }else{ 
            viz.radar.update(data, config, viz.totalCases, viz.precedent);
            // viz.value = viz.radar.getArea(); 
            // console.log(viz.value)
            viz.bar.update(0);
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
                    dateDecision: m.dateDecision
                }
            });//join

            //filter join to remove missing issueArea
            join = join.filter(function(d) { return d.issueArea !== null; });

            //group by issueArea
            var dataByIssueArea = d3.nest()
                .key(function(d){return d.issueArea})
                .rollup(function(v){  return{ 
                    countCases: v.length,
                    issueAreaID: v[0].issueAreaID,
                    unconstCases: d3.sum(v, function(d){
                        if( parseInt(d.declarationUncon) !== 1) return 1//parseInt(d.declarationUncon)
                            else return 0})

                };

                })
                .entries(join);
            viz.draw(dataByIssueArea, update);
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