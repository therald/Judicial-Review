class Precedent {
    constructor(div) {
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
        viz.margin = { top: 10, bottom: 10, left: 10, right: 0 };
        viz.width = viz.totalWidth - viz.margin.left - viz.margin.right;
        viz.height = viz.totalHeight - viz.margin.top - viz.margin.bottom;

        viz.draw();
    }

    draw() {

    }
}