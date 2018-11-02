document.addEventListener("DOMContentLoaded", function(){
	begin();
});

function begin() {
	var anArray = ["test1", "test2", "test3", "test4"];

	d3.select("body").selectAll("p")
		.data(anArray)
		.enter()
		.append("p")
		.text("Hello!")
		.attrs({
			"class": "paragraph_tag"
		});

	var svg = d3.select("body")
		.append("svg")
      	.attrs({
      		"width": 500,
      		"height": 500,
            "bgcolor": "white"
        });

	svg.append("rect")
		.attrs({
			"id": "test_rect",
	  		"x": 50,
	  		"y": 150,
	  		"width": 400,
	  		"height": 200
		});
}