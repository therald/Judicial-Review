class Precedent {
    constructor(div, data) {
        var viz = this;

        // console.log(data);

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
        viz.margin = { top: 10, bot: 20, left: 10, right: 10 };
        viz.width = viz.totalWidth - viz.margin.left - viz.margin.right;
        viz.height = viz.totalHeight - viz.margin.top - viz.margin.bot;

        viz.xaxisgroup = viz.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (viz.margin.top + viz.height) + ")");

        viz.data = data;
        viz.cScale = d3.scaleOrdinal(d3.schemeCategory20);

        viz.xScale = d3.scaleTime().range([viz.margin.left, viz.margin.left+viz.width]);
        viz.xScale.domain(d3.extent(data, d => new Date(d.dateDecision))).nice();

        var dates = data.map(d => new Date(d.dateDecision));
        dates.sort((a, b) => a.getFullYear() - b.getFullYear());
        var dateRange = dates[dates.length - 1] - dates[0];
        viz.xAxis = d3.axisBottom(viz.xScale).ticks(Math.floor(dateRange / (1000*60*60*24*365) / 5));
        viz.xaxisgroup.call(viz.xAxis);

        viz.yScale = d3.scaleLinear().range([viz.margin.top + viz.height, viz.margin.top]);

        d3.csv('../data/precedent_pairs.csv', function(d) {
            return {
                overruled: +d.overruled,
                overruling: +d.overruling,
                importance: +d.importance,
                startdate: new Date(d.startdate),
                enddate: new Date(d.enddate),
                duration: new Date(d.enddate).getFullYear() - new Date(d.startdate).getFullYear()
            }
        }, function(datum) {
            viz.intervals = datum;
            // console.log(new Set(viz.intervals.map(d => viz.data[d.overruled].issueArea)));
            viz.draw();
        });
    }

    /**
     * Take in two parameters of start and end date
     * Only include intervals that have at least one endpoint in the start-end date range
     */
    draw() {
        var viz = this;

        var lines = [];
        var inters = new Set(viz.intervals.sort((a, b) => a.enddate - b.enddate));
        while (inters.size != 0) {
            var line = viz.getIntervalLine(inters);
            lines.push([...line]);
            inters = new Set([...inters].filter(x => [...line].indexOf(x) < 0));
        }
        viz.yScale.domain([0, lines.length]);
        
        // A very annoying and complicated drawing
        // Make a group for each line
        var intervals = viz.svg.selectAll('g.interval').data(lines);
        var enter = intervals.enter()
            .append('g')
            .classed('interval', true)
            .each(function(d, i, g) {
                var group = d3.select(g[i]);
                group.selectAll('line').data(d)
                    .enter()
                    .append('line')
                    .classed('interline', true);

                group.selectAll('circle.startpoint').data(d)
                    .enter()
                    .append('circle')
                    .classed('startpoint', true);
                group.selectAll('circle.endpoint').data(d)
                    .enter()
                    .append('circle')
                    .classed('endpoint', true);
            });
        
        intervals.merge(enter)
            .attr("transform", (d, i) => ("translate(0," + viz.yScale(i) + ")"))
            .each(function(d, i, g) {
                var group = d3.select(g[i]);
                group.selectAll('line.interline')
                    .attr('x1', d => viz.xScale(d.startdate))
                    .attr('x2', d => viz.xScale(d.enddate))
                    .attr('y1', '0')
                    .attr('y2', '0')
                    .attr('stroke-width', 1.5)
                    .attr('stroke', d => viz.cScale(viz.data[d.overruled].issueArea));

                group.selectAll('circle.startpoint')
                    .attr('cx', d => viz.xScale(d.startdate))
                    .attr('cy', '0')
                    .attr('r', 2)
                    .attr('fill', d => viz.data[d.overruled].decisionDirection == 3 ? "black" : (viz.data[d.overruled].decisionDirection == 1 ? "red" : "blue"));
                group.selectAll('circle.endpoint')
                    .attr('cx', d => viz.xScale(d.enddate))
                    .attr('cy', '0')
                    .attr('r', 2)
                    .attr('fill', d => viz.data[d.overruling].decisionDirection == 3 ? "black" : (viz.data[d.overruling].decisionDirection == 1 ? "red" : "blue"));
            });
    }

    getIntervalLine(inters) {
        var inters_sorted = new Set(inters);
        var solution = new Set();
        while (inters_sorted.size != 0) {
            var chosen = [...inters_sorted][0];
            solution.add(chosen);
            inters_sorted.delete(chosen);
            inters_sorted.forEach(function(item) {
                if (item.startdate < chosen.enddate) {
                    inters_sorted.delete(item);
                }
            });
        }
        return solution;
    }
}