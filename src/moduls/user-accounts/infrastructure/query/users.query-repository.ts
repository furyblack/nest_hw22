// import { Injectable, NotFoundException } from '@nestjs/common';
// import { DataSource } from 'typeorm';
// import { InjectDataSource } from '@nestjs/typeorm';
//
// @Injectable()
// export class UsersQueryRepository {
//   constructor(@InjectDataSource() protected dataSource: DataSource) {}
//   async getByIdOrNotFoundFail(
//     id: string | Types.ObjectId,
//   ): Promise<UserViewDto> {
//     const user = await this.UserModel.findOne({
//       _id: id,
//       deletionStatus: DeletionStatus.NotDeleted,
//     });
//
//     if (!user) {
//       throw new NotFoundException('user not found');
//     }
//
//     return UserViewDto.mapToView(user);
//   }
//   async getAll(
//     query: GetUsersQueryParams,
//   ): Promise<PaginatedViewDto<UserViewDto[]>> {
//     const filter: FilterQuery<User> = {
//       deletionStatus: DeletionStatus.NotDeleted,
//     };
//
//     if (query.searchLoginTerm) {
//       filter.$or = filter.$or || [];
//       filter.$or.push({
//         login: { $regex: query.searchLoginTerm, $options: 'i' },
//       });
//     }
//
//     if (query.searchEmailTerm) {
//       filter.$or = filter.$or || [];
//       filter.$or.push({
//         email: { $regex: query.searchEmailTerm, $options: 'i' },
//       });
//     }
//     console.log('sortdirection', query);
//     const users = await this.UserModel.find(filter)
//       .sort({ [query.sortBy]: query.sortDirection })
//       .skip(query.calculateSkip())
//       .limit(query.pageSize);
//
//     const totalCount = await this.UserModel.countDocuments(filter);
//
//     const items = users.map(UserViewDto.mapToView);
//
//     return PaginatedViewDto.mapToView({
//       items,
//       totalCount,
//       page: query.pageNumber,
//       size: query.pageSize,
//     });
//   }
// }
