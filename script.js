let sourceX;
let sourceY;
let detectorX;
let detectorY;
let spacing = 20;
let omega = 10;
let speed1 = 2;
let speed2 = 1;
let zoomFactor = 1;

let effectiveWidth;
let mirrorHeight;
let mirrorThickness;
let glassHeight;
let glassThickness;
let midPoint;
let doubleSlitHoleSize;
let doubleSlitHoleSpacing;

let fired = false;
let pathNumber;
let density;
let contactPoints = [];

//drawing the phasor sum
let originY;
let originX; 
let totalX = 0;
let totalY = 0;

//state = 0 prefire
//state = 1 firing
//state = 2 done firing

let state = 0;
let draggingDetector = false;
let draggingSource = false;

//variables for graphing
let tempDetectX;
let tempDetectY;
let graphVals = [];
let graphX;
let graphY;
let normFactor = 0;

//buttons, slides, checkboxes, dropdown menu
let fireButton;
let menu;
let pathNumberSlider;
let spacingSlider;
let densitySlider;
let graphCheckBox;    //Amplitude
let graphCheckBox2;   //Probablity
let graphCheckBox3;   //Zoom
let zoomInButton; 
let zoomOutButton; 


function setup() {
  createCanvas(1250, 700);
  //Includes the controls in the canvas
  effectiveWidth = width-250;
  sourceX = 150;
  sourceY = 100;
  detectorX = effectiveWidth -100;
  detectorY = 100;
  originY = height*4/5;
  originX = (effectiveWidth-250)/2; 
  totalX = 0;
  totalY = 0;
  
  fireButton = createButton('Fire Photon');
  fireButton.position(effectiveWidth+5, 20);
  fireButton.mousePressed(launch);

  pathNumberSlider = createSlider(1,51, 16, 1);
  pathNumberSlider.position(effectiveWidth + 5, 50);
  pathNumberSlider.style('width', '80px');
  pathNumber = pathNumberSlider.value();
  pathNumberSlider.changed(resetPaths);

  spacingSlider = createSlider(1,32, 16, 1);
  spacingSlider.position(effectiveWidth + 5, 75);
  spacingSlider.style('width', '80px');
  spacing = spacingSlider.value();
  spacingSlider.changed(resetPaths);
  //in Double Slit mode spacing is the gap size

  graphCheckBox = createCheckbox("Graph Amplitude", false);
  graphCheckBox.position(effectiveWidth + 5, 100);
  graphCheckBox2 = createCheckbox("Graph Probability Density", false);
  graphCheckBox2.position(effectiveWidth + 5, 125);
  graphCheckBox3 = createCheckbox("Zoom in on Phasors", false);
  graphCheckBox3.position(effectiveWidth + 5, 150);
  
  graphCheckBox.changed(prepareGraph);
  graphCheckBox2.changed(prepareGraph);
  
  menu = createSelect();
  menu.position(effectiveWidth + 76, 177);
  menu.option('Mirror Reflection');
  menu.option('Refraction');
  menu.option('Double Slit');
  //menu.option('single slit');
  menu.selected('Mirror Reflection');
  menu.changed(situationSetUp);

  zoomInButton = createButton('+');
  zoomInButton.position(width-50, 250);
  zoomInButton.mousePressed(()=>{zoomFactor = zoomFactor*1.2});
  zoomOutButton = createButton('-');
  zoomOutButton.position(width-25, 250);
  zoomOutButton.mousePressed(()=>{zoomFactor = zoomFactor/1.2;});

  //for graphing
  tempDetectY = detectorY;
  tempDetectX = detectorX;

  mirrorHeight = height*2/3;
  mirrorThickness = 10;
  glassHeight = height*1/2;
  glassThickness = height/2;
  doubleSlitHoleSize = 20;
  doubleSlitHoleSpacing = 30;
  

  rectMode(CENTER);
  situationSetUp();
  resetPaths();
  prepareGraph();
  drawSetting();
  //frameRate(10)
}

function draw() {
  background(240);
  makeGraph();
  fill(255);
  stroke(0);
  strokeWeight(.2)
  rect(effectiveWidth+125, height/2, 250,height);
  rect(effectiveWidth+125, height/2, 250,height/3);
  noStroke();
  fill(0);
  textFont('Times');
  textSize(16);
  text("Path Number", effectiveWidth + 95, 48);
  text("Spacing", effectiveWidth + 95, 73);
  text("Scenario:", effectiveWidth + 5, 175);
  text("Vector Sum of Phasors", effectiveWidth + 5, 250);

  if (draggingDetector){
    detectorX = mouseX;
    detectorY = mouseY;
    recalculate();
  }
  if (draggingSource){
    sourceX = mouseX;
    sourceY = mouseY;
    recalculate();
  }
  drawSetting();
  drawPaths();
  drawDetector();
  drawSource();
  drawZoomedArrow();

  fill(255, 0, 0);
  if (state !=0){

    if (menu.value() != "Double Slit"){
      for (let i = 0; i < pathNumber; i++) {
        stroke(0);
        drawArrow(contactPoints[i].x, spacing + midPoint + 3, contactPoints[i].phase, spacing*.4);
      }
    }
    else {
      spacing = 20;
      stroke(0);
      for (let i = 0; i < pathNumber; i++) {
        drawArrow(-2*(1.25*effectiveWidth-3*contactPoints[i].x) , midPoint + 20, contactPoints[i].phase, 5);
      }
    
    }
  }

  if (state == 1) {
    firePhoton();
  } else if (state == 2) {
    stroke(0);
    let tempX = originX;
    let tempY = originY;
    let totalX = 0;
    let totalY = 0;
    for (let i = 0; i < pathNumber; i++) {
      totalX = totalX + zoomFactor * spacing * 0.4 * sin(PI*contactPoints[i].phase/180);
      totalY = totalY - zoomFactor * spacing * 0.4 * cos(PI*contactPoints[i].phase/180);
      drawArrow(tempX, tempY, contactPoints[i].phase,zoomFactor*spacing*.4);
      tempX = tempX + zoomFactor*spacing * 0.4 * sin(PI*contactPoints[i].phase/180);
      tempY = tempY - zoomFactor*spacing * 0.4 * cos(PI*contactPoints[i].phase/180);
    }
    stroke(0,0,250);
    strokeWeight(3);
    line(originX, originY, originX+totalX, originY+totalY)
  }
  }

function firePhoton() {

  if (contactPoints.every(isDone)){
    state = 2;
    return;
  }
  for (let i = 0; i < contactPoints.length; i++) {
    noStroke();
    fill(255, 0, 0);
    if (menu.value() == "Mirror Reflection"){
      if (contactPoints[i].y +
        ((frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y)) / contactPoints[i].s2 < detectorY) {
        contactPoints[i].done = true;
        continue;
        }
      if (sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1  < mirrorHeight) {
        ellipse(
          sourceX + (frameCount * (contactPoints[i].x - sourceX)) / contactPoints[i].s1,
          sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1,
          5,
          5
        );
      } else if (sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1  > detectorY) {
        ellipse(
          contactPoints[i].x + ((frameCount - contactPoints[i].s1) * (detectorX - contactPoints[i].x)) / contactPoints[i].s2,
          contactPoints[i].y + ((frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y)) / contactPoints[i].s2,
          5,
          5
        );
      }
    } 

    else if (menu.value() == "Refraction"){
      if (contactPoints[i].y +
        (.5*(frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y)) / contactPoints[i].s2 > detectorY) {
        contactPoints[i].done = true;
        continue;
        }
      if (sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1  < glassHeight) {
        ellipse(
          sourceX + (frameCount * (contactPoints[i].x - sourceX)) / contactPoints[i].s1,
          sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1,
          5,
          5
        );
      } else {
        ellipse(
          contactPoints[i].x + (.5*(frameCount - contactPoints[i].s1) * (detectorX - contactPoints[i].x)) / contactPoints[i].s2,
          contactPoints[i].y + (.5*(frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y)) / contactPoints[i].s2,
          5,
          5
        );
      }
    }
 
    else if (menu.value() == "Double Slit"){
      if (contactPoints[i].y +
        ((frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y)) / contactPoints[i].s2 > detectorY) {
        contactPoints[i].done = true;
        continue;
        }
      if (sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1  < height/2) {
        ellipse(
          sourceX + (frameCount * (contactPoints[i].x - sourceX)) / contactPoints[i].s1,
          sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1,
          5,
          5
        );
      } else {
        ellipse(
          contactPoints[i].x + (frameCount - contactPoints[i].s1) * (detectorX - contactPoints[i].x) / contactPoints[i].s2,
          contactPoints[i].y + (frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y) / contactPoints[i].s2,
          5,
          5
        );
      }
    }
    contactPoints[i].phase += omega;
  }

}

function launch() {
  for (let i = 0; i < contactPoints.length; i++){
    contactPoints[i].done = false;
    contactPoints[i].phase = 0;
  }
 
  frameCount = 0;
  state = 1;
}

function drawPaths() {
  strokeWeight(1);
  stroke(250, 0, 0, 100);
  for (let i = 0; i < contactPoints.length; i++) {
    line(sourceX, sourceY, contactPoints[i].x, contactPoints[i].y);
    line(contactPoints[i].x, contactPoints[i].y, detectorX, detectorY);
  }
}

function drawArrow(x, y, dir, size) {
  stroke(0);
  push();
  translate(x, y);
  ellipse(0, 0, 1, 1);
  rotate((PI * dir) / 180);
  line(0, 0, 0, -size);
  pop();
}

function drawZoomedArrow(x, y, dir) {
  
  if (graphCheckBox3.checked()){
    
    fill(255, 0, 0);
    if (state !=0){
    
      for (let i = 0; i < pathNumber; i++) {

      drawArrow((contactPoints[i].x - effectiveWidth / 2) * 2 + contactPoints[i].x, 8*height/9, contactPoints[i].phase, spacing*2)
      //stroke(0);
     // push();
     // translate((contactPoints[i].x-effectiveWidth/2)*3+contactPoints[i].x , 8*height/9);
     
     // ellipse(0, 0, 1, 1);
     // rotate((PI * contactPoints[i].phase) / 180);
     // line(0, 0, 0, -8*spacing * 0.4);
     // pop();
   }
  }
  }
 
}


function drawDetector() {
  noStroke();
  fill(255,0,0);
  ellipse(detectorX, detectorY, 5, 5);
}

function drawSource() {
  noStroke();
  fill(255,0,0);
  ellipse(sourceX, sourceY, 5, 5);
}

function isDone(obj) {
  return obj.done;
}

function mousePressed(){
  if (sqrt( (mouseX-detectorX)**2 + (mouseY-detectorY)**2 ) < 5){
    draggingDetector = !draggingDetector;
    draggingSource = false;
  }
  else if (sqrt( (mouseX-sourceX)**2 + (mouseY-sourceY)**2 ) < 5){
    draggingSource = !draggingSource;
  }
}

function makeGraph(){
  let sign = 1;
   if (menu.value() == "Refraction"){sign = -1;}
   if (menu.value() == "Double Slit"){sign = -1;}
  if (graphCheckBox.checked()){
  stroke(0)
  strokeWeight(1);
    for (let i = 0; i<600; i = i+10){
     line(graphX-300+i, graphY, graphX-300+i+5, graphY)
    } 
    stroke(100,100,250,100);
    
    for (let i = 0; i<600; i++){
     
      line(graphX-300+i, graphY, graphX-300+i,graphY+sign*graphVals[i])
    }
     if (detectorX > graphX-300 && detectorX <  graphX+300 && detectorX > graphY-3 && detectorY < graphY+3){

       strokeWeight(2);
       stroke(0,0,250,200);
       line(detectorX, graphY, detectorX, graphY+sign*graphVals[detectorX-graphX+300])
    }
  }
  if (graphCheckBox2.checked()){
  stroke(0)
  strokeWeight(1);
    for (let i = 0; i<600; i = i+10){
     line(graphX-300+i, graphY, graphX-300+i+5, graphY)
    } 
    stroke(250,100,150,100);
    for (let i = 0; i<600; i++){
      line(graphX-300+i, graphY, graphX-300+i,graphY+sign*20000*graphVals[i]*graphVals[i]/normFactor)
    }
  }

}


function prepareGraph(){
  graphVals = [];
  tempDetectX = detectorX; 
  graphX = detectorX;
  graphY = detectorY;
  normFactor = 0;
  for (let i = 0; i<600; i++){
    detectorX = tempDetectX -300 +i; 
    totalX = 0;
    totalY = 0;
    recalculate();
    for (let i = 0; i < pathNumber; i++) {
      totalX = totalX+spacing * 0.4 * sin(PI*contactPoints[i].phase/180);
      totalY = totalY-spacing * 0.4 * cos(PI*contactPoints[i].phase/180);

    }
    graphVals.push(sqrt(totalX*totalX+totalY*totalY));
    normFactor = normFactor + totalX*totalX+totalY*totalY;
  }
  detectorX = tempDetectX;
  recalculate();
}



function situationSetUp(){
  let choice = menu.value();
  pathNumberSlider.attribute("min", 1);
  pathNumberSlider.attribute("max", 51);
  originY = height/2;
  originX = effectiveWidth + 125; 
  totalX = 0;
  totalY = 0;
  fired = false;
  state = 0;
  draggingDetector = false;
  draggingSource = false;
  contactPoints = [];

  if (choice == "Mirror Reflection"){
    sourceX = 150;
    sourceY = 100;
    detectorX = effectiveWidth -150;
    detectorY = 100;
    pathNumberSlider.value(20);
    spacingSlider.value(20);  

  } else if (choice == "Refraction"){
    sourceX = 150;
    sourceY = 100;
    detectorX = effectiveWidth/2 +100;
    detectorY = height-100;
    pathNumberSlider.value(20);
    spacingSlider.value(4);  
    
  } else if (choice == "Double Slit"){
    pathNumberSlider.attribute("min", 2);
    pathNumberSlider.attribute("max", 20);
    sourceX = effectiveWidth/2;
    sourceY = 100;
    detectorX = effectiveWidth/2;
    detectorY = height-100;
    pathNumberSlider.value(2);
    spacingSlider.value(2);     
}
  resetPaths();
  drawPaths();
}


function resetPaths(){
  pathNumber = pathNumberSlider.value();
  spacing = spacingSlider.value();
  //doubleSlitHoleSpacing = spacingSlider.value();

  contactPoints = [];
  let choice = menu.value()

  if (choice == "Mirror Reflection"){
    midPoint = mirrorHeight;
  }
  else if (choice == "Refraction"){
    midPoint = height/2;
  }
  else if (choice == "Double Slit"){
    midPoint = height/2;
  }

  if (choice == "Mirror Reflection" || choice == "Refraction"){
     for (let i = 0; i < pathNumber; i++) {
      contactPoints.push({
        x: effectiveWidth / 2 - (pathNumber / 2) * spacing + spacing * i,
        y: midPoint,
        s1: sqrt(
          (effectiveWidth / 2 - (pathNumber / 2) * spacing + spacing * i - sourceX) ** 2 +
          (midPoint - sourceY) ** 2
        ),
        s2: sqrt(
        (effectiveWidth / 2 - (pathNumber / 2) * spacing + spacing * i - detectorX) **
          2 +
          (midPoint - detectorY) ** 2
        ),
        phase: 0,
        done: false,
        });
      }
  } else if (choice == "Double Slit"){
    for (let i = 0; i < pathNumber/2; i++) {
      contactPoints.push({
        x: effectiveWidth / 2 - doubleSlitHoleSpacing/2 - doubleSlitHoleSize + 2 * i -3,
        y: midPoint,
        s1: sqrt(
          (effectiveWidth / 2 - doubleSlitHoleSpacing/2 - doubleSlitHoleSize + 2 * i -3- sourceX) ** 2 +
          (midPoint - sourceY) ** 2
        ),
        s2: sqrt(
          (effectiveWidth / 2 - doubleSlitHoleSpacing/2 - doubleSlitHoleSize + 2 * i-3 - detectorX) **
          2 +
          (midPoint - detectorY) ** 2
        ),
        phase: 0,
        done: false,
        });
    }
    for (let i = 0; i < pathNumber/2; i++) {
      contactPoints.push({
        x: effectiveWidth / 2 + doubleSlitHoleSpacing/2 + doubleSlitHoleSize - 2 * i +3,
        y: midPoint,
        s1: sqrt(
          (effectiveWidth / 2 + doubleSlitHoleSpacing/2 + doubleSlitHoleSize - 2 * i +3 - detectorX) ** 2 +
          (midPoint - sourceY) ** 2
        ),
        s2: sqrt(
          (effectiveWidth / 2 + doubleSlitHoleSpacing/2 + doubleSlitHoleSize - 2 * i +3- detectorY) **
          2 +
          (midPoint - detectorY) ** 2
        ),
        phase: 0,
        done: false,
        });
    }
  }
  prepareGraph();
   
  return
}



function drawSetting(){
  let choice = menu.value();
  if (choice == "Mirror Reflection"){
    drawMirror(effectiveWidth/2, mirrorHeight+mirrorThickness/2, effectiveWidth, mirrorThickness);
    return;
  } else if (choice == "Refraction"){
    drawGlass(effectiveWidth/2, glassHeight+glassThickness/2, effectiveWidth, glassThickness);
    return;
  } else if (choice == "Double Slit"){
    drawDoubleSlits();
    return;
  } 
  
  function drawMirror(x, y, w, h) {
    noStroke();
    fill(120, 120, 120);
    rect(x, y, w, h);
  }

  function drawGlass(x, y, w, h) {
    noStroke();
    fill(200, 250, 250, 100);
    rect(x, y, w, h);
  }
  function drawDoubleSlits() {
    noStroke();
    fill(100);
    rect(effectiveWidth/2, height/2, effectiveWidth, 5);
    fill(240);
    rect(effectiveWidth/2 - doubleSlitHoleSpacing, height/2, doubleSlitHoleSize, 5);
    rect(effectiveWidth/2 + doubleSlitHoleSpacing, height/2, doubleSlitHoleSize, 5);
  }
}

function recalculate(){
  if (menu.value()== "Refraction"){
    for (let i = 0; i< pathNumber; i++){
      contactPoints[i].s1 =
        sqrt(
          (effectiveWidth / 2 - (pathNumber / 2) * spacing + spacing * i - sourceX) ** 2 +
          (glassHeight - sourceY) ** 2
        );

      contactPoints[i].s2 = 
        sqrt(
          (effectiveWidth / 2 - (pathNumber / 2) * spacing + spacing * i - detectorX) **
          2 + (glassHeight  - detectorY) ** 2
        );
      contactPoints[i].phase = ((contactPoints[i].s1 + 2*contactPoints[i].s2)*omega)%360;
    }
  }
  else if (menu.value()== "Double Slit" || menu.value()== "Mirror Reflection"){
    for (let i = 0; i< pathNumber; i++){
      contactPoints[i].s1 =
        sqrt(
          (contactPoints[i].x - sourceX) ** 2 +
          (contactPoints[i].y - sourceY) ** 2
        );
      contactPoints[i].s2 = 
        sqrt(
          (contactPoints[i].x  - detectorX) **2 + 
          (contactPoints[i].y  - detectorY) ** 2
        );
      contactPoints[i].phase = ((contactPoints[i].s1 + contactPoints[i].s2)*omega)%360 ;
    }
  }
}


