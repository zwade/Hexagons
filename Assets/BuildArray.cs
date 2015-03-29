using UnityEngine;
using System.Collections;

public class BuildArray : MonoBehaviour {

	public GameObject parent;
	public GameObject hexagon;
	public int width = 3;

	private float dX = Mathf.Sqrt (2)*Mathf.Cos (Mathf.PI/6);
	private float dY = Mathf.Sqrt (2);
	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		for (int c = -width+1; c <= width-1; c++) {
			float n = 2*width-1 - Mathf.Abs (c);
			for (float r = -(n-1)/2; r <= (n-1)/2; r++) {
				GameObject cube = Instantiate(hexagon);
				cube.transform.position = new Vector3(dX*c,dY*r,0);
			}
		}
	}
}
