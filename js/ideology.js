class Ideology {
    constructor(div, data, constitutional, precedent) {
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
        viz.width = document.getElementById(div.substring(1)).offsetWidth;
        viz.height = document.getElementById(div.substring(1)).offsetHeight;

        viz.data = data;
        viz.draw();
    }

    draw() {
        var viz = this;

        d3.csv("./data/ideology_data.csv", function (error, ideology_data) {
            var years = ideology_data.map(d => d.Year);
            var parseDate = d3.timeParse("%Y");
            var xScale = d3.scaleTime()
                .domain(d3.extent(years, function(d) { return d; }))
                .range([25, viz.width-25]);

            var xTicks = d3.scaleTime()
                .domain(d3.extent(years, function(d) { return parseDate(d); }))
                .range([25, viz.width-25]);

            var xAxis = d3.axisBottom(xTicks).ticks(years.length/2);

            var stack = d3.stack()
                .keys(["Liberal", "Unspecified", "Conservative"])
                .offset(d3.stackOffsetWiggle);

            var series = stack(ideology_data);

            var mins = series[0].map(d => d[0]);
            var maxs = series[2].map(d => d[1]);

            var yScale = d3.scaleLinear()
                .domain([Math.min(... mins), Math.max(... maxs)])
                .range([viz.height - 75, 0]);


            var fillColorClasses = ["fill_blue", "fill_purple", "fill_red"];

            var area = d3.area()
                .x(function(d) { return xScale(Number(d.data.Year)); })
                .y0(function(d) { return yScale(d[0]); })
                .y1(function(d) { return yScale(d[1]); })
                .curve(d3.curveBasis);

            var index = 0;
            viz.svg.selectAll("path")
                .data(series)
                .enter().append("path")
                .attr("d", area)
                .attr("class", function() { return fillColorClasses[index++]; });

            viz.svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + (viz.height - 60) + ")")
                .call(xAxis)
                .selectAll("text")  
                .style("text-anchor", "end")
                .style("font-size", "0.75rem")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            viz.svg.append("text")
                .attr("transform", "translate(" + (viz.width/2) + " ," + viz.height + ")")
                .style("text-anchor", "middle")
                .text("Year");
        });
    }
}