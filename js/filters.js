class Filters {
    constructor(time_div, issue_area_div, data, ideology, constitutional, precedent) {
        var viz = this;

        // Variable to see if the vizualization is "active", whatever that means
        // in the context of the viz
        viz.active = false;
        viz.time_div = d3.select(time_div);
        viz.issue_area_div = d3.select(issue_area_div);

        viz.ideology = ideology;
        viz.constitutional = constitutional;
        viz.precedent = precedent;

        // Get the total width and height from the div
        viz.totalTimeWidth = viz.time_div.node().getBoundingClientRect().width;
        viz.totalTimeHeight = viz.time_div.node().getBoundingClientRect().height;
        viz.totalIssueWidth = viz.issue_area_div.node().getBoundingClientRect().width;
        viz.totalIssueHeight = viz.issue_area_div.node().getBoundingClientRect().height;

        // Set up the svg to preserve the aspect ratio
        viz.time_svg = viz.time_div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalTimeWidth + " " + viz.totalTimeHeight)
            .attr("preserveAspectRatio", "xMinYMin");
        viz.issue_area_svg = viz.issue_area_div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalIssueWidth + " " + viz.totalIssueHeight)
            .attr("preserveAspectRatio", "xMinYMin");
        
        // d3 margin convention
        viz.timeWidth = document.getElementById(time_div.substring(1)).offsetWidth;
        viz.timeHeight = document.getElementById(time_div.substring(1)).offsetHeight;
        viz.issueWidth = document.getElementById(issue_area_div.substring(1)).offsetWidth;
        viz.issueHeight = document.getElementById(issue_area_div.substring(1)).offsetHeight;

        viz.parseDate = d3.timeParse("%m/%d/%Y");
        viz.parseYear = d3.timeParse("%Y");

        viz.xTicks = d3.scaleTime();

        viz.years = [];
        viz.startYear;
        viz.endYear;
        viz.startHandle;
        viz.endHandle;

        viz.data = data;
        viz.draw();
    }

    draw() {
        var viz = this;

        viz.years = [... new Set(viz.data.map(d => viz.parseDate(d.dateDecision).getFullYear()))];
        viz.startYear = viz.years[0];
        viz.endYear = viz.years[viz.years.length - 1];
        viz.drawTimeFilter(viz);
    }

    drawTimeFilter(viz) {
        viz.xTicks.domain(d3.extent(viz.years, function(d) { return viz.parseYear(d); }))
            .range([50, viz.timeWidth-50]);

        var xAxis = d3.axisBottom(viz.xTicks).tickValues(viz.xTicks.ticks(viz.years.length).concat(viz.xTicks.domain()));

        viz.time_svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (viz.timeHeight - 40) + ")")
            .call(xAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .style("font-size", "0.75rem")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
    }

    drawStartHandle(viz) {

    }

    drawEndHandle(viz) {

    }

    drawIssueAreaFilter() {

    }
}