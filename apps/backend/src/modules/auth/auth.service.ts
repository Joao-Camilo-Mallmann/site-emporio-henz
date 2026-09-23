import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signJwt } from "@/lib/jwt";
import { authRepository, AuthRepository } from "@/modules/auth/auth.repository";
import { AuthResponse, AuthUserProfile, LoginDto, RegisterDto } from "@/modules/auth/auth.types";

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const isTaken = await this.repo.isEmailActive(dto.email);
    if (isTaken) {
      throw new ConflictError("Este e-mail já está em uso.");
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.repo.createCustomer({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
      city: dto.city,
    });

    const token = await signJwt({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user || user.deleted_at !== null) {
      throw new UnauthorizedError("Credenciais inválidas.");
    }

    const isValid = await verifyPassword(dto.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError("Credenciais inválidas.");
    }

    const userProfile: AuthUserProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || "",
      phone: user.phone,
      city: user.city,
    };

    const token = await signJwt({
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
    });

    return {
      token,
      user: userProfile,
    };
  }

  async getProfile(userId: string): Promise<AuthUserProfile> {
    const profile = await this.repo.findById(userId);
    if (!profile) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    return profile;
  }
}

export const authService = new AuthService();
export default authService;
