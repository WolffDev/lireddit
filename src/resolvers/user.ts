import { User } from "./../entities/User";
import { MyContext } from "./../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => UserResponse, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return { user };
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    console.log("### options: ", options);
    if (options.username.length <= 2) {
      return {
        errors: [
          { field: "username", message: "Length must be greater than 2" },
        ],
      };
    }
    if (options.password.length <= 8) {
      return {
        errors: [
          { field: "password", message: "Length must be greater than 6" },
        ],
      };
    }
    try {
      const hashedPassword = await argon2.hash(options.password);
      const user = em.create(User, {
        username: options.username.toLowerCase(),
        password: hashedPassword,
      });
      await em.persistAndFlush(user);
      return { user };
    } catch (error) {
      console.error("Error creating a user: ", error);
      em.clear();

      if (error.code === "23505") {
        return {
          errors: [
            { field: "username", message: "The username already exists" },
          ],
        };
      }
      return {
        errors: [
          {
            field: "unknown",
            message: "Something went wrong with hashing the password",
          },
        ],
      };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    try {
      const user = await em.findOne(User, {
        username: options.username.toLowerCase(),
      });

      if (!user) {
        return {
          errors: [
            {
              field: "username",
              message: "Username does not exists",
            },
          ],
        };
      }
      const valid = await argon2.verify(user.password, options.password);

      if (!valid) {
        return {
          errors: [
            {
              field: "password",
              message: "Incorrect password",
            },
          ],
        };
      }

      req.session.userId = user.id;
      return { user };
    } catch (error) {
      console.error("Error creating a user: ", error);
      return {
        errors: [{ field: "unknown", message: "Something went wrong" }],
      };
    }
  }
}
