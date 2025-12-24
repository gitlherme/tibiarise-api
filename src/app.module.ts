import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CharacterModule } from './modules/character/character.module';
import { DeleteOldExperiencesModule } from './modules/delete-old-experiences/delete-old-experiences.module';
import { ExperienceByWorldModule } from './modules/experience-by-world/experience-by-world.module';
import { PartyManagerModule } from './modules/party-manager/party-manager.module';
import { ProfitManagerModule } from './modules/profit-manager/profit-manager.module';
import { SeedPlayersExperienceModule } from './modules/seed-players-experience/seed-players-experience.module';
import { UserModule } from './modules/user/user.module';
import { VerifyCharacterModule } from './modules/verify-character/verify-character.module';
import { WorldsModule } from './modules/worlds/worlds.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 100000,
    }),
    ScheduleModule.forRoot(),
    SeedPlayersExperienceModule,
    WorldsModule,
    CharacterModule,
    DeleteOldExperiencesModule,
    ExperienceByWorldModule,
    VerifyCharacterModule,
    UserModule,
    ProfitManagerModule,
    PartyManagerModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
