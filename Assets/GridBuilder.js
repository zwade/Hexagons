#pragma strict

var CubePrefab	: GameObject;
var cube_size	: float = 1;
var grid_rows	: int 	= 5;
var build_on_start : boolean = false;

// dictionaries / tables to store grid so it can be accessed through
// any Build_Grid methods should fill in these dictionaries
// multiple coordinate systems, see http://www.redblobgames.com/grids/hexagons/

function Start () {
	if (build_on_start) {
		BuildTriangularGrid( grid_rows );
	}
}

function Update () {
	
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
			Debug.Log("Creating cube at " + xshift + "," + yshift + "," + zshift);
			CreateCube( new Vector3( xshift, yshift, zshift ) * cube_size  );
		}
	}
}

function CreateCube( pos : Vector3) {
	var cube : GameObject = Instantiate( CubePrefab );
	cube.transform.position = pos;
}

function OrientDiagonal(){
	
}

