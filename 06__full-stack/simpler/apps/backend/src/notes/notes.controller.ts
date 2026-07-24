import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('api/notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateNoteDto) {
    return this.notesService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query() query: QueryNoteDto) {
    return this.notesService.findAll(userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notesService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(userId, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notesService.delete(userId, id);
  }

  @Patch(':id/favorite')
  toggleFavorite(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notesService.toggleFavorite(userId, id);
  }

  @Patch(':id/task/:taskId')
  attachToTask(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
  ) {
    return this.notesService.attachToTask(userId, id, taskId);
  }

  @Delete(':id/task')
  detachFromTask(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notesService.detachFromTask(userId, id);
  }

  @Post(':id/convert-to-task')
  convertToTask(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notesService.convertToTask(userId, id);
  }
}
