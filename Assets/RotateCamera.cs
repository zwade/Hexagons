using UnityEngine;
using System.Collections;

//Angle - X:45, Y:atan(1/sqrt(2))
//Interval - Y:sqrt(2), X:sqrt(2)*cos(30)
//Angle of Second Camera - 180-2*atan(sqrt(2))
//this is like 178.bleargh?

public class RotateCamera : MonoBehaviour {

	public float dist = 10;
	public float angle = 0;
	public float speed = 1;

	private float pos1 = 0;
	private float pos2 = Mathf.PI-2*Mathf.Atan (Mathf.Sqrt (2));
	public float goal = 0;
	// Use this for initialization
	void Start () {

	}
	
	// Update is called once per frame
	void Update () {
		transform.position = new Vector3(-dist*Mathf.Sin (angle), 0, -dist*Mathf.Cos (angle));
		transform.eulerAngles = Vector3.up * 180*angle/Mathf.PI;

		if (goal != angle) {
			if (Mathf.Abs (goal-angle) < 0.1) {
				angle = goal;
			}
			int dir = 0;
			if (angle < goal) {
				dir = 1;
			} 
			if (angle > goal) {
				dir = -1;
			}
			angle = angle + dir*speed*Mathf.PI*Time.deltaTime;
		}

		if (Input.GetKeyDown(KeyCode.Space)) {
			if (goal == pos1) {
				goal = pos2;
			} else {
				goal = pos1;
			}
		}
	}
}
