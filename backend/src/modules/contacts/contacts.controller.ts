import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Patch,
  Req
} from '@nestjs/common';

import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService
  ) {}

  @ApiOperation({ summary: 'Add a new contact' })
  @Post()
  async addContact(
    @Req() req: Request,
    @Body() dto: CreateContactDto
  ) {
    const userId = (req.user as any).userId;

    return this.contactsService.addContact(
      userId,
      dto
    );
  }

  @Get()
  async getContacts(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('group') group?: string,
  ) {
    const userId = (req.user as any).userId;

    return this.contactsService.getContacts(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      group
    );
  }

  @ApiOperation({
    summary: 'Delete contacts by group or delete all contacts'
  })
  @Delete('delete-by-group')
  async deleteContactsByGroup(
    @Req() req: Request,
    @Body() body: { group: string }
  ) {
    const userId = (req.user as any).userId;

    const { group } = body;

    if (!group) {
      throw new BadRequestException(
        'Group is required'
      );
    }

    console.log("DELETE REQUEST GROUP: - contacts.controller.ts:90", group);

    return this.contactsService.deleteContactsByGroup(
      userId,
      group
    );
  }

  @ApiOperation({
    summary: 'Delete a contact'
  })
  @Delete(':id')
  async deleteContact(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const userId = (req.user as any).userId;

    return this.contactsService.deleteContact(
      userId,
      id
    );
  }

  @ApiOperation({
    summary: 'Update a contact'
  })
  @Patch(':id')
  async updateContact(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: Partial<CreateContactDto>,
  ) {
    const userId = (req.user as any).userId;

    return this.contactsService.updateContact(
      userId,
      id,
      dto
    );
  }

  @ApiOperation({
    summary: 'Get all contact groups'
  })
  @Get('groups')
  async getGroups(
    @Req() req: Request
  ) {
    const userId = (req.user as any).userId;

    const groups =
      await this.contactsService.getGroups(
        userId
      );

    return groups;
  }

  @ApiOperation({
    summary: 'Search contacts'
  })
  @Get('search')
  async searchContacts(
    @Req() req: Request,
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req.user as any).userId;

    return this.contactsService.searchContacts(
      userId,
      q || '',
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @ApiOperation({
    summary: 'Upload contacts via CSV'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file')
  )
  async uploadContacts(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = (req.user as any).userId;

    if (!file) {
      throw new BadRequestException(
        'CSV file is required'
      );
    }

    return this.contactsService.processCsv(
      userId,
      file.buffer
    );
  }
}