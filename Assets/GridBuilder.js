#pragma strict

var CubePrefab	: GameObject;
var cube_size	: float = 1;
var grid_size	: int 	= 5;
var build_on_start : boolean = false;
var curve		: AnimationCurve;

private var hex_size	: float;
private var rotation_degrees : float;
private var vectors		: Vector3[];

var containers : GameObject[];

var DahGrids : HexGrid[];

var numgrids : int = 0;

// [s] is the side length of the real cube
// [size], side length of the projected hexagon,
// is equal to Sqrt(6)/3 * [s]
// derived from [s] * cos( arctan( 1 / Sqrt(2) ) )

// dictionaries / tables to store grid so it can be accessed through
// any Build_Grid methods should fill in these dictionaries
// multiple coordinate systems, see http://www.redblobgames.com/grids/hexagons/

function Awake () {
	hex_size 	= cube_size * Mathf.Sqrt(6) / 3;
	DahGrids = new HexGrid[2];
	DahGrids[0]		= HexGrid();
	DahGrids[1]		= HexGrid();
	
	containers = new GameObject[2];
	  
	if (build_on_start) {
		containers[0] = BuildHexagonalGridOnPlane(grid_size, DahGrids[0], new PlaneEquation(1, 1, 1));
		containers[1] = BuildHexagonalGridOnPlane(grid_size, DahGrids[1], new PlaneEquation(1, 1, -1));
		containers[1].transform.position.z +=  2*(grid_size) * cube_size;
		
		OrientDiagonal();
		//OrientToFace( BOTTOM_LEFT );
		Debug.Log("did dat");
	}
}

public class PlaneEquation{
	public var wx : int;
	public var wy : int;
	public var wz : int;
	// wx * x + wy * y + wz * z = 0
	// wx, wy, and wz should be 1, 0, or -1
	// :O
	public function PlaneEquation(){
		PlaneEquation(1, 1, 1);
	}
	public function PlaneEquation( wx:int, wy:int, wz:int ){
		this.wx = wx;
		this.wy = wy;
		this.wz = wz;
	}
	public function getWeights(){
		return new Vector3(wx, wy, wz);
	}
	
	//uh someone help me math
	// y = -((wx*x)+(wz*z))/wy
	// ^^ is that right?
	// I don't even know
	public function getY(x : int, z : int){
		//should be an integer
		return -( wx * x + wz * z  ) / wy; 
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
		neighbors.Add( new HexCoords( q-1,	r+1 ) );
		neighbors.Add( new HexCoords( q,	r+1 ) );
		neighbors.Add( new HexCoords( q+1,	r ) );
		neighbors.Add( new HexCoords( q+1,	r-1 ) );
		neighbors.Add( new HexCoords( q,	r-1 ) );
		neighbors.Add( new HexCoords( q-1,	r ) );
		return neighbors;
	}
	public function getHexDistanceTo( hex:HexCoords ){
		return (Mathf.Abs(this.q - hex.q) + Mathf.Abs(this.q - hex.r)
          + Mathf.Abs(this.q + this.r - hex.q - hex.r)) ;
	}
	public function getWorldAxisAlignedPosition( size : float ){
		//xy coordinates for where to find the hex, projected unto 2d
		var x : float =size * Mathf.Sqrt(3)*(q + (r/2.0)); //Mathf.Sqrt(3) * (q - r/2); // Mathf.Sqrt(2)*size*q; //this one seems at least a little right
		var y : float =size * (3.0/2.0 * r);				//Mathf.Sqrt(2)*Mathf.Cos(30)*size*r;
		return new Vector2(x, y);
	}
	public static function getAxialCoords( alignedCoords : Vector2, size : float ){
		//takes rectangular coords, like mouse pos
		var taq : float = (1.0/3.0*Mathf.Sqrt(3.0) * alignedCoords.x - 1.0/3.0 * alignedCoords.y) / size;
		var tar : float = 2.0/3.0 * alignedCoords.y / size;
		return new Vector2(taq, tar);
	}
	public static function roundToHex( axialPos : Vector2 ){
		// nearest hex for given float axial coords
		// can take the output of getAxialCoords
		var az : float	= calcZed(axialPos);
		var rx : int	= Mathf.Round(axialPos.x);
		var ry : int	= Mathf.Round(axialPos.y);
		var rz : int	= Mathf.Round(az);
		
		var xdiff : float = Mathf.Abs( rx - axialPos.x );
		var ydiff : float = Mathf.Abs( ry - axialPos.y );
		var zdiff : float = Mathf.Abs( rz - az);
		
		// x + y + z = 0, fixing if that's not the case
		if( xdiff > ydiff && xdiff > zdiff ) {
			rx = -(ry + rz);
		}
		else if( ydiff > zdiff ) {
			ry = -(rx + rz);
		}
		else {
			rz = -(rx + ry);
		}
		return new HexCoords(rx, ry);
	
	}
	public static function calcZed(cx:float, cy:float){
		return -(cx + cy);
	}
	public static function calcZed(cv : Vector2){
		return -(cv.x + cv.y);
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
	public function hexExists( coords : HexCoords ){
		return hextable.ContainsKey(coords);
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
	
	if( Input.GetMouseButtonDown(0) ) {
		var mouseray : Ray = Camera.main.ScreenPointToRay( Input.mousePosition );
		var floataxial : Vector2 = HexCoords.getAxialCoords(new Vector2(mouseray.origin.x, mouseray.origin.y), hex_size);
		var approxhex : HexCoords = HexCoords.roundToHex(floataxial);
		Debug.Log( "closest hex: " + approxhex);
		
		var targCoords : HexCoords = approxhex;
		var target : GameObject = GetCube( targCoords, 0 );
		if(target != null){
			//target.renderer.material.color = Color.black;
			(target.GetComponent("DataCell") as DataCell).addVal(2);
			var neighs : ArrayList = DahGrids[0].getExistingNeighborsOf( targCoords );
			for (nee in neighs){
				//(GetCube(nee) as GameObject).renderer.material.color = Color.gray;
				((GetCube(nee, 0) as GameObject).GetComponent("DataCell") as DataCell).addVal(1);
			}
		}
		var target2 : GameObject = GetCube( targCoords, 1 );
		if(target2 != null){
			//target.renderer.material.color = Color.black;
			(target2.GetComponent("DataCell") as DataCell).addVal(2);
			var neighs2 : ArrayList = DahGrids[1].getExistingNeighborsOf( targCoords );
			for (nee in neighs2){
				//(GetCube(nee) as GameObject).renderer.material.color = Color.gray;
				((GetCube(nee, 1) as GameObject).GetComponent("DataCell") as DataCell).addVal(1);
			}
		}
	}
	
	if( Input.GetMouseButtonDown(1)){
		OrientToFace( BOTTOM_LEFT );
	}
	if (rotation_degrees > 0) {
		rotation_degrees -= curve.Evaluate((70.5-rotation_degrees)/70.5);
		transform.RotateAround(vectors[0], vectors[1], -curve.Evaluate((70.5-rotation_degrees)/70.5));
	}
	
	//marking the supposed centers of the hexagons in the first grid
	for( var hex : HexCoords in DahGrids[0].hextable.Keys ){
			var huhPos : Vector2 = hex.getWorldAxisAlignedPosition(hex_size);
			Debug.DrawLine( new Vector3(huhPos.x, huhPos.y, -3), new Vector3(huhPos.x, huhPos.y, 3), new Color(0, hex.r*1.0/grid_size, 0) );
	}
	
	//marking the centers of each grid with crosses
	for (var gridcs in containers ){
			var center : Vector3 = gridcs.transform.position;
			Debug.DrawLine( new Vector3(center.x, center.y, center.z-4), new Vector3(center.x, center.y, center.z+4), Color.green);
			Debug.DrawLine( new Vector3(center.x, center.y-4, center.z), new Vector3(center.x, center.y+4, center.z), Color.green);
			Debug.DrawLine( new Vector3(center.x-4, center.y, center.z), new Vector3(center.x+4, center.y, center.z), Color.green);
	}
}

/*function BuildHexagonalGrid( size : int, grid : HexGrid ){
	var gridContainer : GameObject = new GameObject("Grid Container");

	var cubecount : int = 0;
	for( var z : int = -size*2; z < size*2; z++){
		for( var x : int = -size*2; x < size*2; x++){
			var y = -(x + z);
			if( Mathf.Abs(y) > size || Mathf.Abs(x) > size || Mathf.Abs(z) > size){
				continue;
			}
			var tempcube : GameObject = CreateCubeInGrid( new Vector3( x, y, z ), gridContainer  );
			tempcube.name = "Cube"+cubecount;
			cubecount++;
			grid.addHex( new HexCoords(x, y), tempcube );
		}
	}
	numgrids ++;
	gridContainer.transform.parent = this.transform;
	return gridContainer;
}*/

function BuildHexagonalGridOnPlane( size : int, grid : HexGrid, planeE : PlaneEquation ){
	var gridContainer : GameObject = new GameObject("Grid Container");
	var cubecount : int = 0;
	for( var z : int = -size*2; z < size*2; z++){
		for( var x : int = -size*2; x < size*2; x++){
			var y = planeE.getY(x, z);
			
			if( Mathf.Abs(y) > size || Mathf.Abs(x) > size || Mathf.Abs(z) > size){
				continue;
			}
			var tempcube : GameObject = CreateCubeInGrid( new Vector3( x, y, z ), gridContainer  );
			tempcube.name = "Cube"+cubecount;
			cubecount++;
			grid.addHex( new HexCoords(x, y), tempcube );
		}
	}
	numgrids ++;
	gridContainer.transform.parent = this.transform;
	return gridContainer;
}

function CreateCubeInGrid( cubecoords : Vector3, container : GameObject ){
	return CreateCube(cubecoords * cube_size, container);
}

function CreateCube( pos : Vector3, container : GameObject ) {
	var cube : GameObject = Instantiate( CubePrefab, Vector3.zero, Quaternion.identity );
	cube.transform.position = pos;
	cube.transform.parent = container.transform;
	return cube;
}

function GetCube( coords : HexCoords, grid : int ){
	return DahGrids[grid].getHex(coords);
}

function OrientGridContainer( container : GameObject ){
	//probably don't want to use anymore
	container.transform.RotateAround( transform.position, Vector3.up, -45 );
	container.transform.RotateAround( transform.position, Vector3.right, Mathf.Rad2Deg * Mathf.Atan(1/Mathf.Sqrt(2))  ); //[x axis by arctan(1/root(2)]
}


function OrientDiagonal(){
	transform.RotateAround( transform.position, Vector3.up, -45 ); //[y axis by 45]
	transform.RotateAround( transform.position, Vector3.right, Mathf.Rad2Deg * Mathf.Atan(1/Mathf.Sqrt(2))  ); //[x axis by arctan(1/root(2)]
}

final var BOTTOM_LEFT : int = 1;

function OrientToFace( face : int ){
	switch(face){
		//assumes camera is viewing one face correctly 
		//rotates grid system so a new face is shown correctly
		case BOTTOM_LEFT:
			//rotate so the bottom left face is now flush
			//should spin syster up and to the right, 30 degrees? 60?
			
			//evidently working not really but maybe!
			rotation_degrees += 70;
			
			var calced : int;
			
			
			vectors = [new Vector3(0, 0, Mathf.Sqrt(3)/2*8*hex_size*cube_size), new Vector3(-1, Mathf.Sqrt(3), 0)];
			//transform.RotateAround( transform.position, new Vector3(Mathf.Sqrt(3), -1, 0), 5 );
			break;
		default:
			Debug.Log("unrecognized face");
	}
}

