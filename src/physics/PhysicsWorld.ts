import RAPIER from '@dimforge/rapier2d-compat';
import { GRAVITY_Y } from '../types';
import type { Vec2 } from '../types';

export class PhysicsWorld {
  world!: RAPIER.World;
  private _arenaBorderBodies: RAPIER.RigidBody[] = [];

  async init(): Promise<void> {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: GRAVITY_Y });
    this.buildDefaultArenaBorders();
  }

  public buildDefaultArenaBorders(): void {
    this.clearArenaBorders();

    // Ground
    const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 8.4);
    const groundBody = this.world.createRigidBody(groundDesc);
    const groundCol = RAPIER.ColliderDesc.cuboid(25, 0.4)
      .setFriction(0.6)
      .setRestitution(0.05);
    this.world.createCollider(groundCol, groundBody);

    // Left wall
    const leftDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(-15, 4);
    const leftBody = this.world.createRigidBody(leftDesc);
    const leftCol = RAPIER.ColliderDesc.cuboid(0.3, 12)
      .setFriction(0.6)
      .setRestitution(0.05);
    this.world.createCollider(leftCol, leftBody);

    // Right wall
    const rightDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(15, 4);
    const rightBody = this.world.createRigidBody(rightDesc);
    const rightCol = RAPIER.ColliderDesc.cuboid(0.3, 12)
      .setFriction(0.6)
      .setRestitution(0.05);
    this.world.createCollider(rightCol, rightBody);

    // Ceiling
    const ceilDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -4);
    const ceilBody = this.world.createRigidBody(ceilDesc);
    const ceilCol = RAPIER.ColliderDesc.cuboid(25, 0.3)
      .setFriction(0.6)
      .setRestitution(0.05);
    this.world.createCollider(ceilCol, ceilBody);

    this._arenaBorderBodies = [groundBody, leftBody, rightBody, ceilBody];
  }

  public clearArenaBorders(): void {
    for (const b of this._arenaBorderBodies) {
      this.removeRigidBody(b);
    }
    this._arenaBorderBodies = [];
  }

  public removeRigidBody(body: RAPIER.RigidBody): void {
    if (this.world.bodies.contains(body.handle)) {
      this.world.removeRigidBody(body);
    }
  }

  public removeCollider(col: RAPIER.Collider): void {
    if (this.world.colliders.contains(col.handle)) {
      this.world.removeCollider(col, true);
    }
  }

  public getBodyCount(): number {
    return this.world.bodies.len();
  }

  public getColliderCount(): number {
    return this.world.colliders.len();
  }

  step(_dt: number): void {
    this.world.step();
  }

  createDynamicBody(
    x: number,
    y: number,
    linearDamp: number,
    angularDamp: number,
  ): RAPIER.RigidBody {
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y)
      .setLinearDamping(linearDamp)
      .setAngularDamping(angularDamp);
    return this.world.createRigidBody(desc);
  }

  createFixedBody(x: number, y: number): RAPIER.RigidBody {
    const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
    return this.world.createRigidBody(desc);
  }

  addBallCollider(
    body: RAPIER.RigidBody,
    radius: number,
    density: number,
    friction: number,
  ): RAPIER.Collider {
    const col = RAPIER.ColliderDesc.ball(radius)
      .setDensity(density)
      .setFriction(friction);
    return this.world.createCollider(col, body);
  }

  addCapsuleCollider(
    body: RAPIER.RigidBody,
    halfHeight: number,
    radius: number,
    density: number,
    friction: number,
  ): RAPIER.Collider {
    const col = RAPIER.ColliderDesc.capsule(halfHeight, radius)
      .setDensity(density)
      .setFriction(friction);
    return this.world.createCollider(col, body);
  }

  addBoxCollider(
    body: RAPIER.RigidBody,
    halfW: number,
    halfH: number,
    density: number,
    friction: number,
  ): RAPIER.Collider {
    const col = RAPIER.ColliderDesc.cuboid(halfW, halfH)
      .setDensity(density)
      .setFriction(friction);
    return this.world.createCollider(col, body);
  }

  createRevoluteJoint(
    bodyA: RAPIER.RigidBody,
    bodyB: RAPIER.RigidBody,
    anchorA: Vec2,
    anchorB: Vec2,
    minAngle: number,
    maxAngle: number,
  ): RAPIER.RevoluteImpulseJoint {
    const params = RAPIER.JointData.revolute(
      { x: anchorA.x, y: anchorA.y },
      { x: anchorB.x, y: anchorB.y },
    );
    const joint = this.world.createImpulseJoint(
      params,
      bodyA,
      bodyB,
      true,
    ) as RAPIER.RevoluteImpulseJoint;
    joint.setLimits(minAngle, maxAngle);
    joint.configureMotorModel(RAPIER.MotorModel.ForceBased);
    return joint;
  }

  createSpringJoint(
    bodyA: RAPIER.RigidBody,
    bodyB: RAPIER.RigidBody,
    anchorA: Vec2,
    anchorB: Vec2,
    minAngle: number,
    maxAngle: number,
    restAngle: number,
    stiffness: number,
    damping: number,
  ): RAPIER.RevoluteImpulseJoint {
    const joint = this.createRevoluteJoint(
      bodyA,
      bodyB,
      anchorA,
      anchorB,
      minAngle,
      maxAngle,
    );
    joint.configureMotorPosition(restAngle, stiffness, damping);
    return joint;
  }

  isGrounded(body: RAPIER.RigidBody, checkDist: number): boolean {
    const t = body.translation();
    const ray = new RAPIER.Ray({ x: t.x, y: t.y }, { x: 0, y: 1 });
    const hit = this.world.castRay(ray, checkDist, true);
    return hit !== null;
  }

  castRay(origin: Vec2, dir: Vec2, maxToi: number): boolean {
    const ray = new RAPIER.Ray(origin, dir);
    const hit = this.world.castRay(ray, maxToi, true);
    return hit !== null;
  }
}
