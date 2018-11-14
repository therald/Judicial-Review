class Constitutional {
    constructor(div, data) {
        var viz = this;

        // Variable to see if the vizualization is "active", whatever that means
        // in the context of the viz
        viz.active = false;
        viz.div = d3.select(div);

        // Get the total width and height from the div
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;

        // Set up the svg to preserve the aspect ratio
        viz.svg = viz.div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalWidth + " " + viz.totalHeight)
            .attr("preserveAspectRatio", "xMinYMin");
        
        // d3 margin convention
        viz.margin = { top: 10, bottom: 10, left: 10, right: 10 };
        viz.width = viz.totalWidth - viz.margin.left - viz.margin.right;
        viz.height = viz.totalHeight - viz.margin.top - viz.margin.bottom;

        viz.data = data;
        viz.filteredData = data;
        viz.preprocessData();
        
    }

    draw(data){
        var viz = this;
        var max = d3.max(data.map(function(d){return d.value.countCases; }))/viz.totalCases*100;
        console.log(Math.min(Math.ceil(max/10)*10+10,100))    
        var side = Math.min(viz.width-viz.margin.left-viz.margin.right, viz.height-viz.margin.top-viz.margin.bottom)
        console.log(side)
        var config = {
            w: side*0.75,
            h: side*0.75,
            maxValue: 100,//Math.min(Math.ceil(max/10)*10,100),
            levels: 5,
            TranslateX: viz.width/4,
            TranslateY: viz.height/6,
            ExtraWidthX: viz.width,
            ExtraWidthY: viz.height,

        }
        var g = d3.select("#radar")
            .append("svg")
            .append("g")
            .attr("transform", "translate(20,30)");

        var radar = new RadarChart("#radar", data, config, viz.totalCases);
        

    }

    preprocessData() {
        var viz = this;
        console.log(viz.data);
        //attributes to be used d.issueArea, d.declarationUncon, caseId, dateDecision
        //percentage of cases ruled unconstitutional
        viz.totalCases = viz.data.length;
        d3.csv("./data/issue_area.csv", function(a){ 
            var join; 
            join = viz.join(a,viz.data, "id", "issueArea", function(m,iss){
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
                .rollup(function(v){return{
                    countCases: v.length,
                    unconstCases: d3.sum(v, function(d){
                        if( parseInt(d.declarationUncon) !== 1) return parseInt(d.declarationUncon)
                            else return 0})
                };

                })
                .entries(join);
            viz.draw(dataByIssueArea);
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