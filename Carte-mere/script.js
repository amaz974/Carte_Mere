const width = 1200;  // Largeur du graphique
const height = 950;  // Hauteur du graphique (différente de la largeur pour un rectangle)


// Palette de couleurs vives pour un effet rétro graffiti
const color = d3.scaleLinear()
    .domain([0, 5])
    .range(["#f9c74f", "#f94144", "#90be6d", "#577590", "#f3722c"]) // Jaune, rouge, vert, bleu, orange
    .interpolate(d3.interpolateHcl);

// Charger les données JSON
d3.json("data/data.json").then(function(data) {

  const pack = data => d3.pack()
      .size([width, height])
      .padding(3)
    (d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value));

  const root = pack(data);

  const svg = d3.create("svg")
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background-color: #fff8e1; cursor: pointer;`);

  // Ajouter les cercles
  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
      .attr("fill", d => d.children ? color(d.depth) : "#ffffff")  // Couleur de remplissage
      .attr("pointer-events", d => !d.children ? "none" : null)
      .attr("r", d => d.r) // Rayon des cercles
      .attr("stroke", "#1d1d1d") // Bordure sombre pour les cercles
      .attr("stroke-width", 3) // Largeur des bordures
      .style("filter", "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))") // Ombre portée
      .on("mouseover", function() {
        d3.select(this)
          .attr("fill", "#ffcc00"); // Changer légèrement la couleur au survol
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("fill", d => d.children ? color(d.depth) : "#ffffff"); // Revenir à la couleur initiale
      })
      .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

  // Ajouter les labels des cercles
  const label = svg.append("g")
      .style("font", "14px Comic Sans MS, cursive")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .text(d => d.data.name);

  svg.on("click", (event) => zoom(event, root));

  let focus = root;
  let view;
  zoomTo([focus.x, focus.y, focus.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];
    view = v;
    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
  }

  function zoom(event, d) {
    const focus0 = focus;
    focus = d;
    const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });
    label
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
      .transition(transition)
        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }

  document.getElementById('chart').appendChild(svg.node());
});
