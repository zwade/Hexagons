#pragma strict

var CubePrefab	: GameObject;
var cube_size	: float = 1;
var grid_rows	: int 	= 5;
var build_on_start : boolean = false;


// dictionaries / tables to store grid so it can be accessed through
// any Build_Grid methods should fill in these dictionaries
// multiple coordinate systems, see http://www.redblobgames.com/grids/hexagons/

public class HexCoords { 
	public var x : int;
	public var y : int;
	public enum CoordType { Axial, EvenQ, OddQ, EvenR, OddR };
	
	public function HexCoords(){
		HexCoords(0,0);
	}
	public function HexCoords(x:int, y:int){
		this.x = x;
		this.y = y;
	}
	public function HexCoords(q:int, r:int , ctype : CoordType){
		SetCoords(q, r, ctype);
	}
	public function HexCoords( coords3 : Vector3 ){
		HexCoords(coords3.x, coords3.y);
	}
	public function HexCoords( coords2 : Vector2 ){ 
		HexCoords(coords2.x, coords2.y);
	}
	public function GetZ(){
		return -(x+y);
	}
	public function SetCoords(q:int, r:int, ctype : CoordType){
		var zed : int;
		switch( ctype ){	
			case CoordType.EvenQ:
				this.x = q;
				zed = r - (q + (q&1)) / 2;
				this.y = -(x+zed);
				break;
			case CoordType.OddQ:
				this.x = q;
				zed = r - (q - (q&1)) / 2;
				this.y = -(x+zed);
				break;
			case CoordType.EvenR:
				this.x = q - (r + (r&1)) / 2;
				zed = r;
				this.y = -(x+zed);
				break;
			case CoordType.OddR:
				this.x = q - (r - (r&1)) / 2;
				zed = r;
				this.y = -(x+zed);
				break;
			default:
				Debug.Log("HexCoords: Expected an exotic type (got" + ctype + "). Setting as axial.");
				this.x = q;
				this.y = r;
				break;
		}
	}
	
	public function SeeLookHere(){
		//There is a difference between Debug.Log and print. They are different streams with different properties.
		//Debug.Log is more guaranteed to show up in the Unity console.
		print("yup");
		Debug.Log("nope");
	}
	
	public function ToCubeCoords(){
		return new Vector3(x, y, GetZ());
	}
	
	public function ToOtherCoords(ctype : CoordType){
		var ret : Vector2;
		switch ( ctype ) {
			case CoordType.EvenQ:
				ret = new Vector2(x, GetZ()+(x + (x&1))/2 );
				break;
			case CoordType.OddQ:
				ret = new Vector2(x, GetZ()+(x - (x&1))/2 );
				break;
			case CoordType.EvenR:
				ret = new Vector2(x + (GetZ() + (GetZ()&1)) / 2, GetZ() );
				break;
			case CoordType.OddR:
				Debug.Log(4);
				ret = new Vector2(x + (GetZ() - (GetZ()&1)) / 2, GetZ() );
				break;
			default:
				Debug.Log("HexCoords: Expected an exotic type (got" + ctype + "). Returning axial.");
				ret = new Vector2(x, y);
				break;
		}
		return ret;
	}
	
}



function Awake () {
	if (build_on_start) {
		BuildTriangularGrid( grid_rows );
		OrientDiagonal();
	}
}

function Update () {
	if( Input.GetKeyDown( KeyCode.J)){
		(new HexCoords(0, 0)).SeeLookHere();
	}
}

function BuildTriangularGrid( rows : int ) {
	//needs to fill in reference dictionaries, see above

	//builds back, up, and to the right
	//following an x+y+z=0 pattern
	var firstPos : Vector3 = transform.position;
	for( var row : int = 0; row < rows; row++ ) {
		//z coordinate is the row
		//x + y coordinates should sum to equal row
		var zshift = row;
		for( var xshift : int = 0; xshift <= row; xshift++){
			var yshift = row - xshift;
//			Debug.Log("Creating cube at " + xshift + "," + yshift + "," + zshift);
			var tempcube : GameObject = CreateCubeInGrid( new Vector3( xshift, yshift, zshift )  );
		}
	}
}

function CreateCubeInGrid( cubecoords : Vector3 ){
	return CreateCube(cubecoords * cube_size);
}

function CreateCube( pos : Vector3 ) {
	var cube : GameObject = Instantiate( CubePrefab );
	cube.transform.position = pos;
	cube.transform.parent = transform;
	return cube;
}

function GetCube( coords : HexCoords ){
	//return cubecoords[coords];
	Debug.Log("not yet implemented");
}

function OrientDiagonal(){
	// we probably want to rotate the camera, not the cubes, in the end
	// though it doesn't really matter right now
	transform.RotateAround( transform.position, Vector3.up, 45 ); //[y axis by 45]
	transform.RotateAround( transform.position, Vector3.right, -Mathf.Rad2Deg * Mathf.Atan(1/Mathf.Sqrt(2))  ); //[x axis by arctan(1/root(2)]

}	

