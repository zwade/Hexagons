#pragma strict

function Update () {
	if(Input.GetKey(KeyCode.LeftArrow))
		transform.position.x -= .25;
	else if(Input.GetKey(KeyCode.RightArrow))
		transform.position.x += .25;
	if(Input.GetKey(KeyCode.UpArrow))
		transform.position.y += .25;
	else if(Input.GetKey(KeyCode.DownArrow))
		transform.position.y -= .25;
}