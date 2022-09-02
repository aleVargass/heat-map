const url =  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

let colorbrewer = {
    RdYlBu: {
      11: [
        '#a50026',
        '#d73027',
        '#f46d43',
        '#fdae61',
        '#fee090',
        '#ffffbf',
        '#e0f3f8',
        '#abd9e9',
        '#74add1',
        '#4575b4',
        '#313695'
      ]
    }
}

d3.json(url).then(data => {
    data.monthlyVariance.map(d => d.month -=1)
    const width = 5 * Math.ceil(data.monthlyVariance.length / 12);
    const height = 33 * 12;
    const fontSize = 16;
    const padding = {
        top: 1 * fontSize,
        right: 9 * fontSize,
        bottom: 8 * fontSize,
        left: 9 * fontSize
    }

    const tip = d3
    .tip()
    .attr("class", "d3-tip")
    .attr("id", "tooltip")
    .html(d => d)
    .direction("n")
    .offset([-10, 0])

    const svg = d3
        .select("#container")
        .append("svg")
        .attr("width", width + padding.left + padding.right)
        .attr("height", height + padding.top + padding.bottom)
        .call(tip)

    // yaxis
    let yScale = d3
        .scaleBand()
        .domain([0,1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        .rangeRound([0, height])
        .padding(0);

    let yAxis = d3
        .axisLeft(yScale)
        .tickValues(yScale.domain())
        .tickFormat(month => {
            let date = new Date();
            date.setUTCMonth(month);
            let format = d3.timeFormat("%B");
            return format(date);
        })
        .tickSize(10, 1);
    svg
        .append("g")
        .attr("id", "y-axis")
        .attr("transform", "translate(" + padding.left + "," +  padding.top + ")")
        .call(yAxis)
        .append("text")
        .text("Months")
        .attr("transform", "translate("+ -5 * fontSize + "," + height / 2 + ")" + "rotate(-90)")
        .attr("fill", "black");

    // xaxis
    let xScale = d3
        .scaleBand()
        .domain(data.monthlyVariance.map(d => d.year))
        .range([0, width])
        .padding(0);

    let xAxis = d3
        .axisBottom(xScale)
        .tickValues(
            xScale.domain().filter(year => year % 10 === 0)
        )
        .tickFormat(year => {
            let date = new Date(0);
            date.setUTCFullYear(year);
            let format = d3.timeFormat('%Y');
            return format(date);
          })
        .tickSize(10, 1);

    svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", "translate(" + padding.left + "," +  (height + padding.top) + ")")
        .call(xAxis)
        .append("text")
        .text("Years")
        .attr("transform", "translate(" + width / 2 + "," + 3 * fontSize +  ")")
        .attr("fill", "black");

    // legend
    let legendColors = colorbrewer.RdYlBu[11].reverse();
    let legendWidth = 400;
    let legendHeight = 300 / legendColors.length;

    let variance = data.monthlyVariance.map(d => d.variance);

    let minTemp = data.baseTemperature + Math.min.apply(null, variance);
    let maxTemp = data.baseTemperature + Math.max.apply(null, variance);

    let legendThreshold = d3
        .scaleThreshold()
        .domain(
            ((min, max, count) => {
                let array = [];
                let step = (max - min) / count;
                let base = min;
                for (let i = 1; i < count; i++) {
                    array.push(base + i * step);
                }
                return array
            })(minTemp, maxTemp, legendColors.length)
        )
        .range(legendColors)

    let legendX = d3
        .scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, legendWidth]);

    let legendXAxis = d3
        .axisBottom()
        .scale(legendX)
        .tickSize(10, 0)
        .tickValues(legendThreshold.domain())
        .tickFormat(d3.format(".1f"));

    let legend = svg
        .append("g")
        .attr("id", "legend")
        .attr("transform", "translate(" + padding.left + "," + (padding.top + height + padding.bottom - 2 * legendHeight) + ")")

    legend
        .append("g")
        .selectAll("rect")
        .data(legendThreshold.range().map(color => {
            let d = legendThreshold.invertExtent(color);
            if (d[0] === null) d[0] = legendX.domain()[0];
            if (d[1] === null) d[1] = legendX.domain()[1];
            return d;
        }))
        .enter()
        .append("rect")
        .style("fill", d => legendThreshold(d[0]))
        .attr("x", d => legendX(d[0]))
        .attr("y", 0)
        .attr("width",  d => d[0] && d[1] ? legendX(d[1]) - legendX(d[0]) : legendX(null))
        .attr("height", legendHeight);

    legend
        .append("g")
        .attr("transform", "translate(" + 0 + "," + legendHeight + ")")
        .call(legendXAxis)

    // map
    svg
        .append("g")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
        .selectAll("rect")
        .data(data.monthlyVariance)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("i", (d,i) => i)
        .attr("data-month", d => d.month)
        .attr("data-year", d => d.year)
        .attr("data-temp", d => data.baseTemperature + d.variance)
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.month))
        .attr("width", 5)
        .attr("height", 33)
        .attr("fill", d => legendThreshold(data.baseTemperature + d.variance))
        .on("mouseover", function(e, d) {
            let i = this.getAttribute("i")
            let date = new Date(d.year, d.month);
            let str = d3.timeFormat("%Y - %B")(date) + "<br>" +
                d3.format(".1f")(data.baseTemperature + d.variance) + "°C<br>" + 
                d3.format(".1f")(d.variance) + "°C";
            tip.attr("data-year", d.year)
            tip.show(str, this);
        })
        .on("mouseout", tip.hide)
})