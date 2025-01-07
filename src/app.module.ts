import { Module } from '@nestjs/common';
import { SeedPlayersExperienceModule } from './modules/seed-players-experience/seed-players-experience.module';
import { ConfigModule } from '@nestjs/config';
import { WorldsModule } from './modules/worlds/worlds.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CharacterModule } from './modules/character/character.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    SeedPlayersExperienceModule,
    WorldsModule,
    CharacterModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
