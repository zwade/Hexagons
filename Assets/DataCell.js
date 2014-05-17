#pragma strict

var val		: float;
var MAXVAL	: float;
var MINVAL	: float;

var mincolor	: Color;
var maxcolor	: Color;

function Awake () {
	//hwatchyahayahahhahaa!
}

function Update () {
	var scaledval : float = (val - MINVAL) / (MAXVAL - MINVAL); //zero to one
	var lerpcolor : Color = Color.Lerp( mincolor, maxcolor, scaledval );
	renderer.material.color = lerpcolor;
}

function maxOut(){
	val = MAXVAL;
}

function minOut(){
	val = MINVAL;
}

function setPercent( partion : float ){ // partion between zero and one
	val = (MAXVAL - MINVAL) * partion + MINVAL;
}

function setVal( newval : float){
	val = newval;
}

function addVal( addition : float ){
	val += addition;
}


