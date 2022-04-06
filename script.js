let sourceX;
let sourceY;
let detectorX;
let detectorY;
let spacing = 20;
let omega = 10;
let speed1 = 2;
let speed2 = 1;

let mirrorHeight;
let mirrorThickness;
let glassHeight;
let glassThickness;
let midPoint;

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

function setup() {
  createCanvas(1000, 700);
  sourceX = 150;
  sourceY = 100;
  detectorX = width -150;
  detectorY = 100;
  originY = height*4/5;
  originX = width/2; 
  totalX = 0;
  totalY = 0;


  fireButton = createButton('Fire Photon');
  fireButton.position(width+5, 20);
  fireButton.mousePressed(launch);

  pathNumberSlider = createSlider(1,101, 16, 1);
  pathNumberSlider.position(width + 5, 50);
  pathNumberSlider.style('width', '80px');
  pathNumber = pathNumberSlider.value();
  pathNumberSlider.changed(resetPaths);

  spacingSlider = createSlider(1,32, 16, 1);
  spacingSlider.position(width + 5, 75);
  spacingSlider.style('width', '80px');
  spacing = spacingSlider.value();
  spacingSlider.changed(resetPaths);

/*
  densitySlider = createSlider(.001,32, 16);
  densitySlider.position(width + 5, 100);
  densitySlider.style('width', '80px');
  densitySlider.value(pathNumber/spacing);
  densitySlider.changed(resetPaths);
*/

  graphCheckBox = createCheckbox("Graph Amplitude", false);
  graphCheckBox.position(width + 5, 125);
  graphCheckBox2 = createCheckbox("Graph Probability Density", false);
  graphCheckBox2.position(width + 5, 150);
  
  graphCheckBox.changed(prepareGraph);
  graphCheckBox2.changed(prepareGraph);

  
  menu = createSelect();
  menu.position(width + 5, 180);
  menu.option('mirror');
  menu.option('refraction');
  menu.option('double slit');
  menu.option('single slit');
  menu.selected('mirror');
  menu.changed(situationSetUp);

  //for graphing
  tempDetectY = detectorY;
  tempDetectX = detectorX;

  mirrorHeight = height*2/3;
  mirrorThickness = 10;
  glassHeight = height*1/2;
  glassThickness = height/2;
  resetPaths();

  rectMode(CENTER);
  //
  for (let i = 0; i< pathNumber; i++){
    contactPoints[i].s1 =
        sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - sourceX) ** 2 +
          (midPoint - sourceY) ** 2
    );
    contactPoints[i].s2 = 
       sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - detectorX) **
          2 +
          (midPoint  - detectorY) ** 2
    );
    contactPoints[i].phase = ((contactPoints[i].s1 + contactPoints[i].s2)*omega)%360 ;

    }

  prepareGraph();
  drawSetting();
}

function draw() {
  background(250);
  makeGraph();
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

  fill(255, 0, 0);
  if (state !=0){
     for (let i = 0; i < pathNumber; i++) {
    stroke(0);
    drawArrow(contactPoints[i].x, spacing+ midPoint + 3, contactPoints[i].phase);
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
      totalX = totalX+spacing * 0.4 * sin(PI*contactPoints[i].phase/180);
      totalY = totalY-spacing * 0.4 * cos(PI*contactPoints[i].phase/180);
      drawArrow(tempX, tempY, contactPoints[i].phase);
      tempX = tempX + spacing * 0.4 * sin(PI*contactPoints[i].phase/180);
      tempY = tempY - spacing * 0.4 * cos(PI*contactPoints[i].phase/180);
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
    if (menu.value() == "mirror"){
      if (contactPoints[i].y +
        ((frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y)) / contactPoints[i].s2 < detectorY) {
        contactPoints[i].done = true;
        continue;
        }
      if (sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1 + mirrorThickness/2 < mirrorHeight) {
        ellipse(
          sourceX + (frameCount * (contactPoints[i].x - sourceX)) / contactPoints[i].s1,
          sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1,
          5,
          5
        );
      } else if (sourceY + (frameCount * (contactPoints[i].y - sourceY)) / contactPoints[i].s1 + mirrorThickness/2 > detectorY) {
        ellipse(
          contactPoints[i].x + ((frameCount - contactPoints[i].s1) * (detectorX - contactPoints[i].x)) / contactPoints[i].s2,
          contactPoints[i].y + ((frameCount - contactPoints[i].s1) * (detectorY - contactPoints[i].y)) / contactPoints[i].s2,
          5,
          5
        );
      }
    } 

    else if (menu.value() == "refraction"){
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

function drawArrow(x, y, dir) {
  push();
  translate(x, y);
  ellipse(0, 0, 1, 1);
  rotate((PI * dir) / 180);
  line(0, 0, 0, -spacing * 0.4);
  pop();
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
   if (menu.value() == "refraction"){sign = -1;}
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
    if (draggingDetector && mouseX > graphX-300 && mouseX <  graphX+300 && mouseY > graphY-3 && mouseY < graphY+3){

       strokeWeight(2);
       stroke(0,0,250,200);
       line(mouseX, graphY, mouseX, graphY+sign*graphVals[mouseX-graphX+300])
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

function recalculate(){
  for (let i = 0; i< pathNumber; i++){
    contactPoints[i].s1 =
        sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - sourceX) ** 2 +
          (mirrorHeight - sourceY) ** 2
    );

    contactPoints[i].s2 = 
       sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - detectorX) **
          2 +
          (mirrorHeight  - detectorY) ** 2
    );
    contactPoints[i].phase = ((contactPoints[i].s1 + contactPoints[i].s2)*omega)%360 ;

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
  if (choice == "mirror"){
    sourceX = 150;
    sourceY = 100;
    detectorX = width -150;
    detectorY = 100;
    originY = height*4/5;
    originX = width/2; 
    totalX = 0;
    totalY = 0;
    fired = false;
    pathNumberSlider.value(20);
    contactPoints = [];
    spacingSlider.value(20);  
    state = 0;
    draggingDetector = false;
    draggingSource = false;



  } else if (choice == "refraction"){
    sourceX = 150;
    sourceY = 100;
    detectorX = width -150;
    detectorY = height-100;
    originY = height*4/5;
    originX = width/2; 
    totalX = 0;
    totalY = 0;
    fired = false;
    pathNumberSlider.value(20);
    contactPoints = [];
    spacingSlider.value(20);  
    state = 0;
    draggingDetector = false;
    draggingSource = false;
    

   


   
} else if (choice == "double slit"){
}
  resetPaths();
  drawPaths();
}


function resetPaths(){
  pathNumber = pathNumberSlider.value();
  spacing = spacingSlider.value();
  contactPoints = [];
  let choice = menu.value()

  if (choice == "mirror"){
    midPoint = mirrorHeight;
  }
  else if (choice == "refraction"){
    midPoint = height/2;
  }


   for (let i = 0; i < pathNumber; i++) {
    contactPoints.push({
      x: width / 2 - (pathNumber / 2) * spacing + spacing * i,
      y: midPoint,
      s1: sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - sourceX) ** 2 +
          (midPoint - sourceY) ** 2
      ),
      s2: sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - detectorX) **
          2 +
          (midPoint - detectorY) ** 2
      ),
      phase: 0,
      done: false,
    });
  }
  prepareGraph();
  //drawPaths();
   
  return
}



function drawSetting(){
  let choice = menu.value();
 
  if (choice == "mirror"){
    drawMirror(width/2, mirrorHeight+mirrorThickness/2, width, mirrorThickness);
    return;
  } else if(choice == "refraction"){

    drawGlass(width/2, glassHeight+glassThickness/2, width, glassThickness);
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
  function drawDoubleSlits(x, y, w, h) {
    noStroke();
    fill(120, 120, 200);
    rect(x, y, w, h);
  }
  function drawSingleSlit(x, y, w, h) {
    noStroke();
    fill(120, 120, 200);
    rect(x, y, w, h);
  }

}

function recalculate(){
  for (let i = 0; i< pathNumber; i++){
    contactPoints[i].s1 =
        sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - sourceX) ** 2 +
          (mirrorHeight - sourceY) ** 2
    );

    contactPoints[i].s2 = 
       sqrt(
        (width / 2 - (pathNumber / 2) * spacing + spacing * i - detectorX) **
          2 +
          (mirrorHeight  - detectorY) ** 2
    );
    if (menu.value()== "mirror"){
         contactPoints[i].phase = ((contactPoints[i].s1 + contactPoints[i].s2)*omega)%360 ;

    }
  if (menu.value()== "refraction"){
         contactPoints[i].phase = ((contactPoints[i].s1 + 2*contactPoints[i].s2)*omega)%360 ;

    }
    }

}