class Precedent {
    /*
     * TODO
     *  Fix margins when zoomed in
     *  Finish tooltip (look at Christabel's styling)
     *  Add a legend
     *  Add vertical gridlines
     *  Add filters for starting, ending, and issue area
     */

    constructor(div, data) {
        var viz = this;
        viz.active = false;
        viz.div = d3.select(div);
        viz.data = data;
        viz.sortSelect = document.getElementById('precedent_sortby');
        viz.sortReverse = false;
        viz.sortReverseButton = document.getElementById('precedent_reversesort');
        viz.sortReverseButton.addEventListener("click", function() {
            viz.sortReverse = !viz.sortReverse;
        });

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
        viz.tip = d3.tip().attr("class", "d3-tip");
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
        var dateRange = viz.getDateRange();
        viz.xAxis = d3.axisBottom(viz.xScale).ticks(viz.getNumTicks(dateRange)).tickSize(-viz.height);
        viz.xaxisgroup.call(viz.xAxis);

        viz.xaxislabel = viz.svg.append("text")
            .attr("transform", "translate(" + (viz.width/2) + "," + (viz.height) + ")")
            .text("Year")
            .attr("x-axis label");
    }

    getDateRange() {
        var viz = this;
        var dates = viz.data.map(d => new Date(d.dateDecision));
        dates.sort((a, b) => a.getFullYear() - b.getFullYear());
        return dates[dates.length - 1] - dates[0];
    }

    getNumTicks(dateRange) {
        return Math.floor(dateRange / (1000*60*60*24*365) / 5);
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
        if (startYear == null || endYear == null) {
            startYear = viz.range[0];
            endYear = viz.range[1];
        }
        viz.range = [startYear, endYear];

        var rows = viz.generateRows(startYear, endYear);
        viz.xScale.domain([new Date(String(startYear)), new Date(String(endYear))]).nice();
        viz.yScale.domain([0, rows.length]);

        if (rows.length == 0) {
            viz.svg.selectAll('.errMessage').remove();
            viz.svg.append("text")
                .text("No Data for this Time Period")
                .classed("errMessage", true)
                .attr("x", viz.width / 2)
                .attr("y", viz.height / 2);
        } else {
            viz.svg.selectAll('.errMessage').remove();
        }
        
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
                viz.drawInterlines(group, g.length);
                viz.drawStartpoints(group, g.length);
                viz.drawEndpoints(group, g.length);
            });
        
        viz.svg.selectAll('.interline')
            .on('mouseover', function(d, i, g) {
                viz.showTooltip(d, g[i]);
            })
            .on('mouseout', viz.tip.hide)

        viz.xaxisgroup.call(viz.xAxis);
        viz.sortSelect.addEventListener("change", function() {
            viz.draw(viz.range[0], viz.range[1]);
        }, {once: true});
        viz.sortReverseButton.addEventListener("click", function() {
            viz.draw(viz.range[0], viz.range[1]);
        }, {once: true});
    }

    getSortingAlgo(a, b) {
        var viz = this;

        switch (viz.sortSelect.options[viz.sortSelect.selectedIndex].value) {
            case 'startdate': return viz.sortByStartdate(a, b);
            case 'length': return viz.sortByLength(a, b);
            default: return viz.sortByEnddate(a, b);
        }
    }

    showTooltip(intervalData, group) {
        var viz = this;
        var overruled = viz.data[Number(intervalData.overruled)];
        var overruling = viz.data[Number(intervalData.overruling)];

        var html = `<p>
                        <b>${overruling.caseName} (${overruling.dateDecision})</b>
                    </p>
                    <p>overruling</p>
                    <p>
                        <b>${overruled.caseName} (${overruled.dateDecision})</b>
                    </p>`;
        viz.tip.html(html);
        viz.tip.offset([-5, 0]);
        // viz.tip.style("min-width", viz.width).style("max-width", viz.width);
        viz.tip.direction('n').show(intervalData, group);
    }

    createRowKey(row, index) {
        var itemKeys = row.map(d => d.overruled + ' ' + d.overruling);
        return itemKeys.join(' ') + ' ' + index;
    }

    generateRows(startYear, endYear) {
        var viz = this;

        // var rows = [];
        // var inters = new Set(viz.intervals.sort((a, b) => a.enddate - b.enddate));
        // while (inters.size != 0) {
        //     var line = viz.getIntervalLine(inters);
        //     rows.push([...line]);
        //     inters = new Set([...inters].filter(x => [...line].indexOf(x) < 0));
        // }
        var rows = viz.intervals
            .filter(d => viz.filterByStartAndEndYear(d, startYear, endYear))
            .sort(function(a, b) {
                return viz.getSortingAlgo(a, b);
            })
            .map(d => [d]);
        return rows;
    }

    sortByEnddate(a, b) {
        var viz = this;
        if (viz.sortReverse) {
            return a.enddate - b.enddate;
        }
        return b.enddate - a.enddate;
    }

    sortByStartdate(a, b) {
        var viz = this;
        if (viz.sortReverse) {
            return a.startdate - b.startdate;
        }
        return b.startdate - a.startdate;
    }

    sortByLength(a, b) {
        var viz = this;
        if (viz.sortReverse) {
            return a.duration - b.duration;
        }
        return b.duration - a.duration;
    }

    filterByStartAndEndYear(interval, startYear, endYear) {
        if (interval.startdate.getFullYear() >= startYear && interval.startdate.getFullYear() < endYear) {
            return true;
        }
        if (interval.enddate.getFullYear() >= startYear && interval.enddate.getFullYear() < endYear) {
            return true;
        }
        return false;
    }

    drawEndpoints(group, numLines) {
        var viz = this;
        group.selectAll('circle.endpoint')
            .attr('cx', d => viz.xScale(d.enddate))
            .attr('cy', '0')
            .attr('r', viz.getIntervalHeight(numLines))
            .attr('fill', d => viz.data[d.overruling].decisionDirection == 3 ? "black" : (viz.data[d.overruling].decisionDirection == 1 ? "red" : "blue"));
    }

    drawStartpoints(group, numLines) {
        var viz = this;
        group.selectAll('circle.startpoint')
            .attr('cx', d => viz.xScale(d.startdate))
            .attr('cy', '0')
            .attr('r', viz.getIntervalHeight(numLines))
            .attr('fill', d => viz.data[d.overruled].decisionDirection == 3 ? "black" : (viz.data[d.overruled].decisionDirection == 1 ? "red" : "blue"));
    }

    drawInterlines(group, numLines) {
        var viz = this;
        group.selectAll('line.interline')
            .attr('x1', d => viz.xScale(d.startdate))
            .attr('x2', d => viz.xScale(d.enddate))
            .attr('y1', '0')
            .attr('y2', '0')
            .attr('stroke-width', viz.getIntervalHeight(numLines) - 1)
            .attr('stroke', d => viz.cScale(viz.data[d.overruled].issueArea));
    }

    getIntervalHeight(numLines) {
        var viz = this;
        return Math.min(viz.yScale.range()[0] / numLines / 2 - 1, 6);
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