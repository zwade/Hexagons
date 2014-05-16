#pragma strict


//Angle - X:45, Y:atan(1/sqrt(2))
//Interval - Y:sqrt(2), X:sqrt(2)*cos(30)
//Angle of Second Camera - 180-2*atan(sqrt(2))
							//this is like 178.bleargh?
var angle:float = 0;
var dist:float = 10;

private var isTLeft:boolean = false;
private var isTRight:boolean = false; 

function Start () {

}

function Update () {
	var pos:Vector3;
	pos.x = -dist*Mathf.Sin(angle);
	pos.z = -dist*Mathf.Cos(angle); 
	pos.y = 0;
	
	transform.position = pos;
	
	transform.eulerAngles.y = angle;
	
	if (Input.GetKeyDown("space")) {
		if (isTLeft) {
			isTLeft = false;
			isTRight = true;
		} else if (isTRight) {
			isTRight = false;
			isTLeft = true;
		} else if (angle == 0) {
			isTLeft = true;
			isTRight = false;
		} else {
			isTRight = true;
			isTLeft = false;
		}
	}
	
	if (isTLeft) {
		if (angle >= 180-2* Mathf.Rad2Deg 	*Mathf.Atan(Mathf.Sqrt(2))) {
			angle = 180-2* Mathf.Rad2Deg 	*Mathf.Atan(Mathf.Sqrt(2));
			isTLeft = false;
		} else {
			angle++;
		}
	} else if (isTRight) {
		if (angle <= 0) {
			angle = 0;
			isTRight = false;
		} else {
			angle++;
		}
	}

}