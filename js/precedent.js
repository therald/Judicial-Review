class Precedent {
    constructor(div, data) {
        var viz = this;
        viz.active = false;
        viz.div = d3.select(div);
        viz.data = data;

        viz.setVizWidthAndHeight(div);

        viz.createSVG();
        viz.creatXScale(20);
        viz.createYScale(50);

        viz.createColorScale();
        viz.createXAxis();

        viz.createTooltip();

        d3.csv('./data/precedent_pairs.csv', function(d) {
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

            var dates = viz.data.map(d => new Date(d.dateDecision));
            dates.sort((a, b) => a.getFullYear() - b.getFullYear());
            viz.draw(dates[0].getFullYear(), dates[dates.length - 1].getFullYear());
        });
    }

    createTooltip() {
        var viz = this;
        viz.tip = d3.tip().attr("class", "d3-tip").attr("width", viz.width);
        viz.svg.call(viz.tip);
    }

    createYScale(bottomMargin) {
        var viz = this;
        viz.yScale = d3.scaleLinear().range([viz.height - bottomMargin, 0]);
    }

    creatXScale(margin) {
        var viz = this;
        viz.xScale = d3.scaleTime().range([margin, viz.width - margin]);
        viz.xScale.domain(d3.extent(viz.data, d => new Date(d.dateDecision))).nice();
    }

    createColorScale() {
        var viz = this;
        viz.cScale = d3.scaleOrdinal(d3.schemeCategory20);
    }

    createXAxis() {
        var viz = this;
        viz.xaxisgroup = viz.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (viz.yScale.range()[0] + 10) + ")");
        var dates = viz.data.map(d => new Date(d.dateDecision));
        dates.sort((a, b) => a.getFullYear() - b.getFullYear());
        var dateRange = dates[dates.length - 1] - dates[0];
        viz.xAxis = d3.axisBottom(viz.xScale).ticks(Math.floor(dateRange / (1000*60*60*24*365) / 5));
        viz.xaxisgroup.call(viz.xAxis);

        viz.xaxislabel = viz.svg.append("text")
            .attr("transform", "translate(" + (viz.width/2) + "," + (viz.height) + ")")
            .text("Year")
            .attr("x-axis label");
    }

    createSVG() {
        var viz = this;
        viz.svg = viz.div.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 " + viz.totalWidth + " " + viz.totalHeight)
            .attr("preserveAspectRatio", "xMinYMin");
    }

    setVizWidthAndHeight(div) {
        var viz = this;
        viz.totalWidth = viz.div.node().getBoundingClientRect().width;
        viz.totalHeight = viz.div.node().getBoundingClientRect().height;
        viz.width = document.getElementById(div.substring(1)).offsetWidth;
        viz.height = document.getElementById(div.substring(1)).offsetHeight;
    }

    /**
     * Take in two parameters of start and end date
     * Only include intervals that have at least one endpoint in the start-end date range
     */
    draw(startYear, endYear) {
        var viz = this;

        var rows = viz.generateRows(startYear, endYear);
        viz.xScale.domain([new Date(String(startYear)), new Date(String(endYear))]).nice();
        viz.yScale.domain([0, rows.length]);
        
        var intervals = viz.svg.selectAll('g.interval').data(rows, viz.createRowKey);
        intervals.exit().remove();
        var enter = intervals.enter()
            .append('g')
            .classed('interval', true)
            .each(viz.appendIntervalComponents);
        intervals.merge(enter)
            .attr("transform", (d, i) => ("translate(0," + viz.yScale(i) + ")"))
            .each(function(d, i, g) {
                var group = d3.select(g[i]);
                viz.drawInterlines(group);
                viz.drawStartpoints(group);
                viz.drawEndpoints(group);
            });
        
        viz.svg.selectAll('.interline')
            .on('mouseover', function(d, i, g) {
                viz.showTooltip(d, g[i]);
            })
            .on('mouseout', viz.tip.hide)

        viz.xaxisgroup.call(viz.xAxis);
    }

    showTooltip(intervalData, group) {
        var viz = this;
        var overruled = viz.data[Number(intervalData.overruled)];
        var overruling = viz.data[Number(intervalData.overruling)];

        var html = `<h6>${overruling.caseName} overruling ${overruled.caseName}`
        viz.tip.html(html);
        viz.tip.offset([-5, 0]);
        viz.tip.direction('n').show(intervalData, group);
    }

    createRowKey(row) {
        var itemKeys = row.map(d => d.overruled + ' ' + d.overruling);
        return itemKeys.join(' ');
    }

    generateRows(startYear, endYear) {
        var viz = this;
        // var lines = [];
        // var inters = new Set(viz.intervals.sort((a, b) => a.enddate - b.enddate));
        // while (inters.size != 0) {
        //     var line = viz.getIntervalLine(inters);
        //     lines.push([...line]);
        //     inters = new Set([...inters].filter(x => [...line].indexOf(x) < 0));
        // }
        var rows = viz.intervals.filter(d => viz.filterByStartAndEndYear(d, startYear, endYear)).sort(viz.sortByEnddate).map(d => [d]);
        return rows;
    }

    sortByEnddate(a, b) {
        return b.enddate - a.enddate;
    }

    filterByStartAndEndYear(interval, startYear, endYear) {
        if (interval.startdate.getFullYear() >= startYear && interval.startdate.getFullYear() <= endYear) {
            return true;
        }
        if (interval.enddate.getFullYear() >= startYear && interval.enddate.getFullYear() <= endYear) {
            return true;
        }
        return false;
    }

    drawEndpoints(group) {
        var viz = this;
        group.selectAll('circle.endpoint')
            .attr('cx', d => viz.xScale(d.enddate))
            .attr('cy', '0')
            .attr('r', 2)
            .attr('fill', d => viz.data[d.overruling].decisionDirection == 3 ? "black" : (viz.data[d.overruling].decisionDirection == 1 ? "red" : "blue"));
    }

    drawStartpoints(group) {
        var viz = this;
        group.selectAll('circle.startpoint')
            .attr('cx', d => viz.xScale(d.startdate))
            .attr('cy', '0')
            .attr('r', 2)
            .attr('fill', d => viz.data[d.overruled].decisionDirection == 3 ? "black" : (viz.data[d.overruled].decisionDirection == 1 ? "red" : "blue"));
    }

    drawInterlines(group) {
        var viz = this;
        group.selectAll('line.interline')
            .attr('x1', d => viz.xScale(d.startdate))
            .attr('x2', d => viz.xScale(d.enddate))
            .attr('y1', '0')
            .attr('y2', '0')
            .attr('stroke-width', 2)
            .attr('stroke', d => viz.cScale(viz.data[d.overruled].issueArea));
    }

    appendIntervalComponents(d, i, g) {
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