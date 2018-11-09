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
        viz.width = document.getElementById(div).offsetWidth;
        viz.height = document.getElementById(div).offsetHeight;

        viz.data = data;
        viz.draw();
    }

    draw() {
        var viz = this;

        var decisionShortDates = viz.data.map(m => m.dateDecision);
        var decisionYears = decisionShortDates.map(d => d.split("/")[2]);
        var decisionDistinctYears = new Set(decisionYears);
        console.log(decisionDistinctYears);

        var xScale = d3.scaleLinear()
            .domain(d3.min(decisionDistinctYears), d3.max(decisionDistinctYears))
            .range(0, viz.width);

        var fillColorClasses = ["fill_red", "fill_gray", "fill_blue"];


    }
}