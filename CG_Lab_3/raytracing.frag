#version 430

out vec4 FragColor;
in vec3 glPosition;

// Ratio of refraction indices of air and glass
const float RefractionIndex = 0.3;
const vec3 RED = vec3 ( 1.0, 0.0, 0.0 );
const vec3 GREEN = vec3 ( 0.0, 1.0, 0.0 );
const vec3 BLUE = vec3 ( 0.0, 0.0, 1.0 );
const vec3 YELLOW = vec3 ( 1.0, 1.0, 0.0 );
const vec3 WHITE = vec3 ( 1.0, 1.0, 1.0 );
const vec3 Zero = vec3 ( 0.0, 0.0, 0.0 );
const vec3 Unit = vec3 ( 1.0, 1.0, 1.0 );
const vec3 AxisX = vec3 ( 1.0, 0.0, 0.0 );
const vec3 AxisY = vec3 ( 0.0, 1.0, 0.0 );
const vec3 AxisZ = vec3 ( 0.0, 0.0, 1.0 );
const vec3 MirrorX = vec3 ( -1.0, 1.0, 1.0 );
const vec3 MirrorY = vec3 ( 1.0, -1.0, 1.0 );
const vec3 MirrorZ = vec3 ( 1.0, 1.0, -1.0 );

const float EPSILON = 0.001;
const float BIG = 1000000.0;

const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;

const int REFRACTION = 3;


/****************************** DATA STRUCTURES ********************************/

struct SCamera
{
	vec3 Position;
	vec3 View;
	vec3 Up;
	vec3 Side;
	// отношение сторон выходного изображения
	vec2 Scale;
};

struct SRay
{
	vec3 Origin;
	vec3 Direction;
};

struct SMaterial
{
	//diffuse color
    vec3 Color;
    // ambient, diffuse and specular coeffs
	vec4 LightCoeffs;
    // 0 - non-reflection, 1 - mirror
	float ReflectionCoef;
	float RefractionCoef;
    int MaterialType;
};

struct SIntersection
{
float Time;
vec3 Point;
vec3 Normal;
vec3 Color;
// ambient, diffuse and specular coeffs
vec4 LightCoeffs;
// 0 - non-reflection, 1 - mirror
float ReflectionCoef;
float RefractionCoef;
int MaterialType;
};

struct SSphere
{
	vec3 Center;
	float Radius;
	int MaterialIdx;
};

struct STriangle
{
	vec3 v1;
	vec3 v2;
	vec3 v3;
	int MaterialIdx;
	vec3 Color;
};

struct SLight
{
	vec3 Position;
};

struct STracingRay
{
	SRay ray;
	float contribution;
	int depth;
};

uniform SCamera uCamera;
uniform int material;
uniform float reflection;
uniform float refraction;
uniform int TraceDeep;
SLight uLight;
SMaterial materials[6];


SSphere spheres[2];
STriangle triangles[16];


//***************** Initialization ***********************//


void initializeDefaultLightMaterials(out SLight light, out SMaterial materials[6])
{
	//** LIGHT **//
	light.Position = vec3(0.0, 2.0, -4.0f);
	//** MATERIALS **//
	vec4 lightCoefs = vec4(0.4,0.9,0.0,512.0);

	materials[0].Color = vec3(0.0, 1.0, 0.0);
	materials[0].LightCoeffs = vec4(lightCoefs);
	materials[0].ReflectionCoef = 0.5;
	materials[0].RefractionCoef = 1.0;
	materials[0].MaterialType = DIFFUSE_REFLECTION;

	materials[1].Color = vec3(0.0, 0.0, 1.0);
	materials[1].LightCoeffs = vec4(lightCoefs);
	materials[1].ReflectionCoef = 0.5;
	materials[1].RefractionCoef = 1.0;
	materials[1].MaterialType = DIFFUSE_REFLECTION;
}


void initializeDefaultScene(out STriangle triangles[16], out SSphere spheres[2])
{
/** TRIANGLES **/
/* left wall */
triangles[0].v1 = vec3(-5.0,-5.0,-10.0);
triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
triangles[0].v3 = vec3(-5.0, 5.0,-10.0);
triangles[0].MaterialIdx = 1;
triangles[0].Color = vec3 (0, 1, 0);
triangles[1].v1 = vec3(-5.0,-5.0,-10.0);
triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
triangles[1].v3 = vec3(-5.0, 5.0, 5.0);
triangles[1].MaterialIdx = 1;
triangles[1].Color = vec3 (0, 1, 0);

/* back wall */
triangles[2].v1 = vec3(-5.0,-5.0, 5.0);
triangles[2].v2 = vec3( 5.0,-5.0, 5.0);
triangles[2].v3 = vec3(-5.0, 5.0, 5.0);
triangles[2].MaterialIdx = 1;
triangles[2].Color = vec3 (0, 1, 1);
triangles[3].v1 = vec3( 5.0, 5.0, 5.0);
triangles[3].v2 = vec3(-5.0, 5.0, 5.0);
triangles[3].v3 = vec3( 5.0,-5.0, 5.0);
triangles[3].MaterialIdx = 1;
triangles[3].Color = vec3 (0, 1, 1);

/* right wall */
triangles[4].v1 = vec3(5.0,-5.0, -10.0);
triangles[4].v2 = vec3( 5.0,-5.0, 5.0);
triangles[4].v3 = vec3(5.0, 5.0, 5.0);
triangles[4].MaterialIdx = 0;
triangles[4].Color = vec3 (1, 0, 0);
triangles[5].v1 = vec3( 5.0, 5.0, 5.0);
triangles[5].v2 = vec3(5.0, 5.0, -10.0);
triangles[5].v3 = vec3( 5.0,-5.0, -10.0);
triangles[5].MaterialIdx = 1;
triangles[5].Color = vec3 (1, 0, 0);

/* bottom wall */
triangles[6].v1 = vec3(5.0, 5.0, 5.0);
triangles[6].v2 = vec3(-5.0, 5.0, 5.0);
triangles[6].v3 = vec3(5.0, 5.0, -10.0);
triangles[6].MaterialIdx = 1;
triangles[6].Color = vec3 (1, 1, 1);
triangles[7].v1 = vec3(-5.0, 5.0, 5.0);
triangles[7].v2 = vec3(-5.0, 5.0, -10.0);
triangles[7].v3 = vec3( 5.0, 5.0, -10.0);
triangles[7].MaterialIdx = 1;
triangles[7].Color = vec3 (1, 1, 1);

/* top wall */
triangles[8].v1 = vec3(-5.0, -5.0, 5.0);
triangles[8].v2 = vec3(5.0, -5.0, -10.0);
triangles[8].v3 = vec3(5.0, -5.0, 5.0);
triangles[8].MaterialIdx = 1;
triangles[8].Color = vec3 (1, 1, 1);
triangles[9].v1 = vec3(5.0, -5.0, -10.0);
triangles[9].v2 = vec3(-5.0, -5.0, -10.0);
triangles[9].v3 = vec3( -5.0, -5.0, 5.0);
triangles[9].MaterialIdx = 1;
triangles[9].Color = vec3 (1, 1, 1);

/* front wall */
triangles[10].v1 = vec3(5.0, -5.0, -10.0);
triangles[10].v2 = vec3(-5.0, -5.0, -10.0);
triangles[10].v3 = vec3(-5.0, 5.0, -10.0);
triangles[10].MaterialIdx = 1;
triangles[10].Color = vec3 (1, 1, 1);
triangles[11].v1 = vec3(5.0, -5.0, -10.0);
triangles[11].v2 = vec3(-5.0, 5.0, -10.0);
triangles[11].v3 = vec3( 5.0, 5.0, -10.0);
triangles[11].MaterialIdx = 1;
triangles[11].Color = vec3 (1, 1, 1);

/** TRIANGLE **/
triangles[12].v1 = vec3(4.0,-4.0, 0.0);
triangles[12].v2 = vec3(2.0, -4.0, 0.0);
triangles[12].v3 = vec3(3.0, -4.0,-2.0);
triangles[12].MaterialIdx = 1;
triangles[12].Color = vec3 (0, 1, 1);

triangles[13].v1 = vec3(3.0,-2.0, -1.0);
triangles[13].v2 = vec3(2.0, -4.0, 0.0);
triangles[13].v3 = vec3(3.0, -4.0,-2.0);
triangles[13].MaterialIdx = 1;
triangles[13].Color = vec3 (0, 1, 1);

triangles[14].v1 = vec3(4.0,-4.0, 0.0);
triangles[14].v2 = vec3(3.0,-2.0, -1.0);
triangles[14].v3 = vec3(3.0, -4.0,-2.0);
triangles[14].MaterialIdx = 1;
triangles[14].Color = vec3 (0, 1, 1);

triangles[15].v1 = vec3(4.0,-4.0, 0.0);
triangles[15].v2 = vec3(2.0, -4.0, 0.0);
triangles[15].v3 = vec3(3.0,-2.0, -1.0);
triangles[15].MaterialIdx = 1;
triangles[15].Color = vec3 (0, 1, 1);



/** SPHERES **/
spheres[0].Center = vec3(-1.0,-1.0,-2.0);
spheres[0].Radius = 2.0;
spheres[0].MaterialIdx = 0;
spheres[1].Center = vec3(2.0,1.0,2.0);
spheres[1].Radius = 1.0;
spheres[1].MaterialIdx = 0;
}

SRay GenerateRay ( SCamera uCamera )
{
	vec2 coords = glPosition.xy * uCamera.Scale;
	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
	return SRay ( uCamera.Position, normalize(direction) );
}

bool IntersectSphere ( SSphere sphere, SRay ray, float start, float final, out float time )
{
	ray.Origin -= sphere.Center;
	float A = dot ( ray.Direction, ray.Direction );
	float B = dot ( ray.Direction, ray.Origin );
	float C = dot ( ray.Origin, ray.Origin ) - sphere.Radius * sphere.Radius;
	float D = B * B - A * C;
	if ( D > 0.0 )
	{
		D = sqrt ( D );
		//time = min ( max ( 0.0, ( -B - D ) / A ), ( -B + D ) / A );

		float t1 = ( -B - D ) / A;
		float t2 = ( -B + D ) / A;
		if(t1 < 0 && t2 < 0)
			return false;
		if(min(t1, t2) < 0)
		{

			time = max(t1,t2);
			return true;
		}

		time = min(t1, t2);

		return true;
	}
	return false;
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time )
{
// // Compute the intersection of ray with a triangle using geometric solution
// Input: // points v0, v1, v2 are the triangle's vertices
// rayOrig and rayDir are the ray's origin (point) and the ray's direction
// Return: // return true is the ray intersects the triangle, false otherwise
// bool intersectTriangle(point v0, point v1, point v2, point rayOrig, vector rayDir) {
// compute plane's normal vector
time = -1;
vec3 A = v2 - v1;
vec3 B = v3 - v1;
// no need to normalize vector
vec3 N = cross(A, B);
// N
// // Step 1: finding P
// // check if ray and plane are parallel ?
float NdotRayDirection = dot(N, ray.Direction);
if (abs(NdotRayDirection) < 0.001)
return false;
// they are parallel so they don't intersect !
// compute d parameter using equation 2
float d = dot(N, v1);
// compute t (equation 3)
float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
// check if the triangle is in behind the ray
if (t < 0)
return false;
// the triangle is behind
// compute the intersection point using equation 1
vec3 P = ray.Origin + t * ray.Direction;
// // Step 2: inside-outside test //
vec3 C;
// vector perpendicular to triangle's plane
// edge 0
vec3 edge1 = v2 - v1;
vec3 VP1 = P - v1;
C = cross(edge1, VP1);
if (dot(N, C) < 0)
return false;
// P is on the right side
// edge 1
vec3 edge2 = v3 - v2;
vec3 VP2 = P - v2;
C = cross(edge2, VP2);
if (dot(N, C) < 0)
return false;
// P is on the right side
// edge 2
vec3 edge3 = v1 - v3;
vec3 VP3 = P - v3;
C = cross(edge3, VP3);
if (dot(N, C) < 0)
return false;
// P is on the right side;
time = t;
return true;
// this ray hits the triangle
}

bool Raytrace( SRay ray, float start, float final, inout SIntersection intersect )
{
	bool result = false;
	float test = start;
	intersect.Time = final;

	//calculate intersect with spheres
	for(int i = 0; i < 2; i++)
	{
		SSphere sphere = spheres[i];
		if( IntersectSphere (sphere, ray, start, final, test ) && test < intersect.Time )
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = normalize ( intersect.Point - spheres[i].Center );
			intersect.Color = vec3(0,1,1);
			intersect.LightCoeffs = vec4(0.4f, 0.9f, 0.2f, 2.0f);
			intersect.ReflectionCoef = reflection;
			intersect.RefractionCoef = refraction;
			intersect.MaterialType = material;
			result = true;
		}
	}
	//calculate intersect with triangles
	for(int i = 0; i < 12; i++)
	{
		STriangle triangle = triangles[i];
		if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time)
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal =
			normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			intersect.Color = triangles[i].Color;
			intersect.LightCoeffs = vec4(0.4f, 0.9f, 0.2f, 2.0f);
			intersect.ReflectionCoef = 0.5f;
			intersect.RefractionCoef = 1;
			intersect.MaterialType = DIFFUSE_REFLECTION;
			result = true;
		}
	}

	for(int i = 12; i < 16; i++)
	{
		STriangle triangle = triangles[i];
		if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time)
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal =
			normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			intersect.Color = vec3(0,1,1);
			intersect.LightCoeffs = vec4(0.4f, 0.9f, 0.2f, 2.0f);
			intersect.ReflectionCoef = reflection;
			intersect.RefractionCoef = refraction;
			intersect.MaterialType = material;
			result = true;
		}
	}

	return result;
}

vec3 Phong ( SIntersection intersect, SLight currLight, float shadowing )
{
	vec3 light = normalize ( currLight.Position - intersect.Point );
	float diffuse = max(dot(light, intersect.Normal), 0.0);
	vec3 view = normalize(uCamera.Position - intersect.Point);
	vec3 reflected= reflect( -view, intersect.Normal );
	float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);
	return intersect.LightCoeffs.x * intersect.Color +
	intersect.LightCoeffs.y * diffuse * intersect.Color * shadowing +
	intersect.LightCoeffs.z * specular * Unit;
}

float Shadow(SLight currLight, SIntersection intersect)
{
	// Point is lighted
	float shadowing = 1.0;
	// Vector to the light source
	vec3 direction = normalize(currLight.Position - intersect.Point);
	// Distance to the light source
	float distanceLight = distance(currLight.Position, intersect.Point);
	// Generation shadow ray for this light source
	SRay shadowRay = SRay(intersect.Point + direction * EPSILON, direction);
	// ...test intersection this ray with each scene object
	SIntersection shadowIntersect;
	shadowIntersect.Time = BIG;
	// trace ray from shadow ray begining to light source position
	if(Raytrace(shadowRay, 0, distanceLight, shadowIntersect))
	{
		// this light source is invisible in the intercection point
		shadowing = 0.0;
	}
	return shadowing;
}

float Fresnel(const vec3 I, const vec3 N, const float ior)
{
    float kr;
    float cosi = clamp(-1, 1, dot(I,N));
    float etai = 1, etat = ior;
    if (cosi > 0) 
	{
        float temp = etai;
        etai = etat;
        etat = temp;
    }

	// Compute sini using Snell's law
	float sint = etai / etat * sqrt(max(0.f, 1 - cosi * cosi));
    // Total internal reflection
	if (sint >= 1) 
	{
        kr = 1;
        return kr;
    }
	else 
	{
        float cost = sqrt(max(0.f, 1 - sint * sint));
        cosi = abs(cosi);
        float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
        float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));
        return kr = (Rs * Rs + Rp * Rp) / 2;
    }

// As a consequence of the conservation of energy, transmittance is given by:
// kt = 1 - kr;
} 


const int MAX_STACK_SIZE = 10;//10
int MAX_TRACE_DEPTH = TraceDeep;//8
STracingRay stack[MAX_STACK_SIZE];
int stackSize = 0;
bool pushRay(STracingRay secondaryRay)
{
	if(stackSize < MAX_STACK_SIZE - 1 && secondaryRay.depth < MAX_TRACE_DEPTH)
	{
		stack[stackSize] = secondaryRay;
		stackSize++;
		return true;
	}
	return false;
}

bool isEmpty()
{
	if(stackSize < 0)
		return true;
	return false;
}

STracingRay popRay()
{
	stackSize--;
	return stack[stackSize];	
}

void main ( void )
{
	float start = 0;
	float final = BIG;

	//uCamera = initializeDefaultCamera();

	SRay ray = GenerateRay( uCamera );

	vec3 resultColor = vec3(0,0,0);

	initializeDefaultLightMaterials(uLight, materials);

	initializeDefaultScene(triangles, spheres);


	STracingRay trRay = STracingRay(ray, 1, 0);
	pushRay(trRay);
	while(!isEmpty())
	{
		STracingRay trRay = popRay();
		ray = trRay.ray;
		SIntersection intersect;
		initializeDefaultLightMaterials(uLight, materials);
		intersect.Time = BIG;
		start = 0;
		final = BIG;
		if (Raytrace(ray, start, final, intersect))
		{
			switch(intersect.MaterialType)
			{
				case DIFFUSE_REFLECTION:
				{
					float shadowing = Shadow(uLight, intersect);
					resultColor += trRay.contribution * Phong ( intersect, uLight, shadowing );
					break;
				}
				case MIRROR_REFLECTION:
				{
					if(intersect.ReflectionCoef < 1)
					{
						float contribution = trRay.contribution * (1 -
						intersect.ReflectionCoef);
						float shadowing = Shadow(uLight, intersect);
						resultColor += contribution * Phong(intersect, uLight, shadowing);
					}
					vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
					// creare reflection ray
					float contribution = trRay.contribution * intersect.ReflectionCoef;
					STracingRay reflectRay = STracingRay(SRay(intersect.Point + reflectDirection * EPSILON, reflectDirection), contribution, trRay.depth + 1);
					pushRay(reflectRay);
					break;
				}
				case REFRACTION:
			    {
                    bool outside = (dot(ray.Direction, intersect.Normal) < 0);					
                    vec3 bias = EPSILON * intersect.Normal;
                    float ior = outside ? 1.0/intersect.RefractionCoef : intersect.RefractionCoef; //VV
				    int signOut = outside ? 1 : -1;
                    float kr = Fresnel(ray.Direction, intersect.Normal * signOut, ior);
                    // compute refraction if it is not a case of total internal reflection
				    kr = 0.99;
				    if (kr < 1) 
				    {
                        vec3 refractionDirection = normalize(refract(ray.Direction,  intersect.Normal * signOut, ior/2));
					    vec3 refractionRayOrig = intersect.Point + EPSILON * refractionDirection;
                        STracingRay refractRay = STracingRay(SRay(refractionRayOrig, refractionDirection), trRay.contribution * kr, trRay.depth + 1);

                        pushRay(refractRay);
                    }
				    break;
                }
			} // switch
		} // if (Raytrace(ray, start, final, intersect))
	} // while(!isEmpty())
	FragColor = vec4 (resultColor, 1.0);
}