#pragma strict

var CubePrefab	: GameObject;
var cube_size	: float = 1;
var grid_rows	: int 	= 5;
var build_on_start : boolean = false;
var JTarget	:	Vector2;

private var hex_size : float;

var DaGrid : HexGrid;

// [s] is the side length of the real cube
// [size], side length of the projected hexagon,
// is equal to Sqrt(6)/3 * [s]
// derived from [s] * cos( arctan( 1 / Sqrt(2) ) )

// dictionaries / tables to store grid so it can be accessed through
// any Build_Grid methods should fill in these dictionaries
// multiple coordinate systems, see http://www.redblobgames.com/grids/hexagons/

function Awake () {
	hex_size = cube_size * Mathf.Sqrt(6) / 3;
	DaGrid = HexGrid();
	if (build_on_start) {
		BuildTriangularGrid( grid_rows, DaGrid );
		OrientDiagonal();
	}
}

public class HexCoords { 
	public var q : int;
	public var r : int;
	public enum CoordType { Axial, EvenQ, OddQ, EvenR, OddR };
	
	public function HexCoords(){
		HexCoords(0,0);
	}
	public function HexCoords(q:int, r:int){
		this.q = q;
		this.r = r;
	}
	public function HexCoords(a:int, b:int , ctype : CoordType){
		setCoords(a, b, ctype);
	}
	public function HexCoords( coords3 : Vector3 ){
		HexCoords(coords3.x, coords3.y);
	}
	public function HexCoords( coords2 : Vector2 ){ 
		HexCoords(coords2.x, coords2.y);
	}
	
	//should have the effect of making HexCoords with
		//equal x and y coordinates be treated as equal by
		//stuff such as Hashtable
	public function ToString(){
		return "[HexCoords:"+q+","+r+"]";
	}
	public function GetHashCode(){
		return this.ToString().GetHashCode(); //muahaha cuz I totally payed attention in APCS
	}
	public function Equals( other : Object ){
		if( typeof(other) != HexCoords ){
			Debug.LogWarning("Comparing HexCoords to non-hexcoord object (" + other +").");
			return super.Equals(other);
		}
		return this.q == (other as HexCoords).q && this.r == (other as HexCoords).r;
		//alternatively, this.ToString == other.ToString
	}
	public function getZ(){
		//not always technically Z axis
		//third coordinate to finish (q + r + zed = 0) 
		return -(q+r);
	}
	public function getPossibleNeighbors(){
		var neighbors : ArrayList = ArrayList();
		neighbors.Add( new HexCoords( q+1,	r ) );
		neighbors.Add( new HexCoords( q,	r+1 ) );
		neighbors.Add( new HexCoords( q-1,	r ) );
		neighbors.Add( new HexCoords( q,	r-1 ) );
		neighbors.Add( new HexCoords( q+1,	r+1 ) );
		neighbors.Add( new HexCoords( q-1,	r-1 ) );
		return neighbors;
	}
	public function getHexDistanceTo( hex:HexCoords ){
		return (Mathf.Abs(this.q - hex.q) + Mathf.Abs(this.q - hex.r)
          + Mathf.Abs(this.q + this.r - hex.q - hex.r)) ;
	}
	public function getWorldAxisAlignedPosition( size : float ){
		//xy coordinates for where to find the hex, projected unto 2d
		var x : float =size * Mathf.Sqrt(3)*(q - (r/2.0)); //Mathf.Sqrt(3) * (q - r/2); // Mathf.Sqrt(2)*size*q; //this one seems at least a little right
		var y : float =size * (3.0/2.0 * r);				//Mathf.Sqrt(2)*Mathf.Cos(30)*size*r;
		return Vector2(x, y);
	}
	
	public function setCoords(cq:int, cr:int, ctype : CoordType){
		var zed : int;
		switch( ctype ){	
			case CoordType.EvenQ:
				this.q = cq;
				zed = cr - (cq + (cq&1)) / 2;
				this.r = -(this.q+zed);
				break;
			case CoordType.OddQ:
				this.q = cq;
				zed = cr - (cq - (cq&1)) / 2;
				this.r = -(this.q+zed);
				break;
			case CoordType.EvenR:
				this.q = cq - (cr + (cr&1)) / 2;
				zed = cr;
				this.r = -(this.q+zed);
				break;
			case CoordType.OddR:
				this.q = cq - (cr - (cr&1)) / 2;
				zed = cr;
				this.r = -(this.q+zed);
				break;
			default:
				Debug.Log("HexCoords: Expected an exotic type (got" + ctype + "). Setting as axial.");
				this.q = cq;
				this.r = cr;
				break;
		}
	}
	/*public function toCubeCoords(){
		return new Vector3(x, y, getZ());
	}*/
	/*public function toOtherCoords(ctype : CoordType){
		var ret : Vector2;
		switch ( ctype ) {
			case CoordType.EvenQ:
				ret = new Vector2(x, getZ()+(x + (x&1))/2 );
				break;
			case CoordType.OddQ:
				ret = new Vector2(x, getZ()+(x - (x&1))/2 );
				break;
			case CoordType.EvenR:
				ret = new Vector2(x + (getZ() + (getZ()&1)) / 2, getZ() );
				break;
			case CoordType.OddR:
				Debug.Log(4);
				ret = new Vector2(x + (getZ() - (getZ()&1)) / 2, getZ() );
				break;
			default:
				Debug.Log("HexCoords: Expected an exotic type (got" + ctype + "). Returning axial.");
				ret = new Vector2(x, y);
				break;
		}
		return ret;
	}*/
}

public class HexGrid{
	var hextable : Hashtable;
	public function HexGrid(){
		hextable = Hashtable();
	}
	public function addHex( coords : HexCoords, item : Object ){
		hextable.Add( coords, item );
	}
	public function getHex( coords : HexCoords ){
		//Debug.Log("trying to get at " + coords);
		return hextable[coords];
	}
	public function getExistingNeighborsOf( coords : HexCoords ){
		var possibles : ArrayList = coords.getPossibleNeighbors();
		var definites : ArrayList = new ArrayList();
		for( possibility in possibles ){
			if( hextable.ContainsKey(possibility) ){
				definites.Add(possibility);
			}
		}
		return definites;
	}
	public function displayContents(){
		for( var item : DictionaryEntry in hextable ){
			Debug.Log( item.Key +"\t:"+ item.Value);
		}
	}
	
}




function Update () {
	if( Input.GetMouseButtonDown(0)) {
		Debug.Log(Camera.main.ScreenPointToRay( Input.mousePosition ));
		
		
		//DaGrid.displayContents();
		var targCoords : HexCoords = new HexCoords(JTarget.x, JTarget.y);
		
		targCoords.getWorldAxisAlignedPosition(hex_size);
		
		var target : GameObject = GetCube( targCoords );
		
		Debug.Log( "target:"+ target );
		
		var suppPos : Vector2 = targCoords.getWorldAxisAlignedPosition(hex_size);
		Debug.DrawLine( new Vector3(suppPos.x, suppPos.y, -10), new Vector3(suppPos.x, suppPos.y, 10) );
		
		if(target != null){
			target.renderer.material.color = Color.black;
			var neighs : ArrayList = DaGrid.getExistingNeighborsOf( targCoords );
			for (nee in neighs){
				//Debug.Log(nee);
				(GetCube(nee) as GameObject).renderer.material.color = Color.gray;
				
				var huhPos : Vector2 = (nee as HexCoords).getWorldAxisAlignedPosition(0.8);
				Debug.DrawLine( new Vector3(huhPos.x, huhPos.y, -10), new Vector3(huhPos.x, huhPos.y, 10) );
			}
		}
	}
}

function BuildTriangularGrid( rows : int, grid : HexGrid ) {
	
	var firstPos : Vector3 = transform.position;
	var cubes : int = 0;
	for( var row : int = 0; row < rows; row++ ) {
		//z coordinate is the row
		//x + y coordinates should sum to equal row
		var zshift = row;
		for( var xshift : int = 0; xshift <= row; xshift++){
			var yshift = row - xshift;
			var tempcube : GameObject = CreateCubeInGrid( new Vector3( xshift, yshift, zshift )  );
			tempcube.name = "Cube"+cubes;
			cubes++;
			grid.addHex( new HexCoords(zshift, yshift), tempcube );
		}
		
		//currently, hex grid is like this:
		//axial
		//q is z coord
		//r is y coord
		//+q runs straight right
		//+r runs up to the left
	}
}

function CreateCubeInGrid( cubecoords : Vector3 ){
	return CreateCube(cubecoords * cube_size);
}

function CreateCube( pos : Vector3 ) {
	var cube : GameObject = Instantiate( CubePrefab, Vector3.zero, Quaternion.identity );
	cube.transform.position = pos;
	cube.transform.parent = transform;
	return cube;
}

function GetCube( coords : HexCoords ){
	return DaGrid.getHex(coords);
}

function OrientDiagonal(){
	// we probably want to rotate the camera, not the cubes, in the end
	// though it doesn't really matter right now
	transform.RotateAround( transform.position, Vector3.up, 45 ); //[y axis by 45]
	transform.RotateAround( transform.position, Vector3.right, -Mathf.Rad2Deg * Mathf.Atan(1/Mathf.Sqrt(2))  ); //[x axis by arctan(1/root(2)]

}	

