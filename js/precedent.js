class Precedent {

    /*
     * Magnify last one by default
     * Summary writings
     */

    constructor(div, data) {
        var viz = this;
        viz.active = false;
        viz.div = d3.select(div);
        viz.data = data;

        viz.sortSelect = document.getElementById('precedent_sortby');
        viz.groupSelect = document.getElementById('precedent_groupby');

        viz.sortReverse = false;
        viz.sortReverseButton = document.getElementById('precedent_reversesort');
        viz.sortReverseButton.addEventListener("click", function() {
            viz.sortReverse = !viz.sortReverse;
        });

        viz.setVizWidthAndHeight(div);

        viz.createSVG();
        viz.creatXScale(20);
        viz.createYScale(25);

        viz.createColorScale();
        viz.createXAxis();
        viz.createGridLines();

        d3.csv('./data/issue_area.csv', function(d) {
            return {
                id: +d.id,
                name: d.IssueAreaName
            }
        }, function(datum) {
            viz.issueAreaMapping = {}
            datum.forEach(function(d) {
                viz.issueAreaMapping[d.id] = d.name;
            });
        });

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

            viz.sortSelect.addEventListener("change", function() {
                viz.draw(viz.range[0], viz.range[1], viz.issueAreas);
            });
            viz.groupSelect.addEventListener("change", function() {
                viz.draw(viz.range[0], viz.range[1], viz.issueAreas);
            });
            viz.sortReverseButton.addEventListener("click", function() {
                viz.draw(viz.range[0], viz.range[1], viz.issueAreas);
            });
        });
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
        viz.xAxis = d3.axisBottom(viz.xScale).ticks(viz.getNumTicks(dateRange));
        viz.xaxisgroup.call(viz.xAxis);

        viz.xaxislabel = viz.svg.append("text")
            .attr("transform", "translate(" + (viz.width/2) + "," + (viz.height) + ")")
            .attr("x-axis label");
    }

    createGridLines() {
        var viz = this;
        viz.gridlinegroup = viz.svg.append("g")
            .attr("class", "gridline")
            .attr("transform", "translate(0," + (viz.yScale.range()[0] + 10) + ")");
        var dateRange = viz.getDateRange();
        viz.gridlines = d3.axisBottom(viz.xScale).ticks(viz.getNumTicks(dateRange))
            .tickSize(-viz.height*19/20, 0)
            .tickFormat("");
        viz.gridlinegroup.call(viz.xAxis);
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
    draw(startYear, endYear, issueAreas) {
        var viz = this;
        if (startYear == null || endYear == null) {
            startYear = viz.range[0];
            endYear = viz.range[1];
        }
        viz.range = [startYear, endYear];
        if (issueAreas == null) {
            issueAreas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
        }
        viz.issueAreas = issueAreas;

        var rows = viz.generateRows(startYear, endYear);
        viz.xScale.domain([new Date(String(startYear)), new Date(String(endYear))]).nice(d3.timeYear);
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
        
        // viz.svg.selectAll(".gridline").data(viz.yScale.ticks(15))
        
        viz.svg.selectAll('.interline')
            .on('mouseover', function(d, i, g) {
                viz.showTooltip(d, g[i]);
            })
            .on('mouseout', viz.hideTooltip)

        viz.xaxisgroup.call(viz.xAxis);
        viz.gridlinegroup.call(viz.gridlines);
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

        var [plaintiff, vs, defendant] = viz.parseTitle(overruling.caseName);
        var overruling_html = "<p>" + plaintiff + "</p>\n<p class='vs'>v.</p>\n<p>" + defendant + "</p>";
        d3.select("#overruling_title").html(overruling_html);

        d3.select("#overruling_text").text("overruling");

        var [plaintiff, vs, defendant] = viz.parseTitle(overruled.caseName);
        var overruled_html = "<p>" + plaintiff + "</p>\n<p class='vs'>v.</p>\n<p>" + defendant + "</p>";
        d3.select("#overruled_title").html(overruled_html);
        d3.select("#date_range").text(overruled.dateDecision + " - " + overruling.dateDecision);
    }

    parseTitle(title) {
        var words = title.split(' ');
        words = words.map(d => d == d.toUpperCase() ? d.charAt(0) + d.toLowerCase().slice(1) : d);
        var vsIndex = words.findIndex(d => d == 'v.');
        var plaintiff = words.slice(0, vsIndex).join(" ");
        var defendant = words.slice(vsIndex + 1).join(" ");
        return [plaintiff, 'v.', defendant];
    }

    hideTooltip() {
        var viz = this;
        d3.select("#overruling_title").text(null);
        d3.select("#overruling_text").text(null);
        d3.select("#overruled_title").text(null);
        d3.select("#date_range").text(null);
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
            .filter(d => viz.issueAreas.includes(viz.data[d.overruled].issueArea))
            .sort(function(a, b) {
                return viz.getSortingAlgo(a, b);
            })
            .sort(function(a, b) {
                return viz.groupBy(a, b);
            })
            .map(d => [d]);
        return rows;
    }

    groupBy(a, b) {
        var viz = this;
        switch (viz.groupSelect.options[viz.groupSelect.selectedIndex].value) {
            case "startideo": return viz.groupByStartIdeo(a, b);
            case "endideo": return viz.groupByEndIdeo(a, b);
            case "issuearea": return viz.groupByIssueArea(a, b);
            default: return 0;
        }
    }

    groupByIssueArea(a, b) {
        var viz = this;
        var aName = viz.issueAreaMapping[viz.data[a.overruled].issueArea];
        var bName = viz.issueAreaMapping[viz.data[b.overruled].issueArea];
        if (aName < bName) {
            return -1;
        } else if (aName > bName) {
            return 1;
        }
        return 0;
    }

    groupByStartIdeo(a, b) {
        var viz = this;
        var aIdeo = viz.data[a.overruled].decisionDirection;
        var bIdeo = viz.data[b.overruled].decisionDirection;
        return aIdeo - bIdeo;
    }

    groupByEndIdeo(a, b) {
        var viz = this;
        var aIdeo = viz.data[a.overruling].decisionDirection;
        var bIdeo = viz.data[b.overruling].decisionDirection;
        return aIdeo - bIdeo;
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
            .attr('class', d => 'endpoint ' + (viz.data[d.overruling].decisionDirection == 3 ? "undecided" : (viz.data[d.overruling].decisionDirection == 1 ? "conservative" : "liberal")))
            .attr('opacity', d => viz.xScale.domain()[1] < d.enddate ? 0 : 1);
    }

    drawStartpoints(group, numLines) {
        var viz = this;
        group.selectAll('circle.startpoint')
            .attr('cx', d => viz.xScale(d.startdate))
            .attr('cy', '0')
            .attr('r', viz.getIntervalHeight(numLines))
            .attr('class', d => 'startpoint ' + (viz.data[d.overruled].decisionDirection == 3 ? "undecided" : (viz.data[d.overruled].decisionDirection == 1 ? "conservative" : "liberal")))
            .attr('opacity', d => viz.xScale.domain()[0] > d.startdate ? 0 : 1);
    }

    drawInterlines(group, numLines) {
        var viz = this;
        var offLeft = false;
        var offRight = false;
        group.selectAll('rect.interline')
            .attr('x', function(d) {
                offLeft = viz.xScale.domain()[0] > d.startdate;
                return Math.max(viz.xScale(viz.xScale.domain()[0]), viz.xScale(d.startdate));
            })
            .attr('y', viz.getIntervalHeight(numLines) - 2*viz.getIntervalHeight(numLines))
            .attr('width', function(d) {
                offRight = viz.xScale.domain()[1] < d.enddate;
                if (offLeft) {
                    return viz.xScale(d.enddate) - viz.xScale(viz.xScale.domain()[0]);
                }
                else if (offRight) {
                    return viz.xScale(viz.xScale.domain()[1]) - viz.xScale(d.startdate);
                } else {
                    return viz.xScale(d.enddate) - viz.xScale(d.startdate);
                }
            })
            .attr('height', 2*viz.getIntervalHeight(numLines))
            .attr('class', d => 'interline fill_' + viz.data[d.overruled].issueArea, true);
    }

    getIntervalHeight(numLines) {
        var viz = this;
        return Math.min(viz.yScale.range()[0] / numLines / 2 - 1.3, 6);
    }

    appendIntervalComponents(d, i, g) {
        var group = d3.select(g[i]);
        group.selectAll('line').data(d)
            .enter()
            .append('rect')
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