import { Module } from '@nestjs/common';
import { SeedPlayersExperienceModule } from './modules/seed-players-experience/seed-players-experience.module';
import { ConfigModule } from '@nestjs/config';
import { WorldsModule } from './modules/worlds/worlds.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    SeedPlayersExperienceModule,
    WorldsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
