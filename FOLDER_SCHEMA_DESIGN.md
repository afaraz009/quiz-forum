# Folder Schema Design

## Requirements
1. Users can create folders to organize their quizzes
2. Quizzes can be moved between folders
3. Each quiz belongs to one folder (or default "Uncategorized" folder)
4. Folders belong to specific users
5. Default folder cannot be deleted

## Database Schema Design

### Folder Model
- id: String (Primary Key, cuid)
- name: String (Folder name)
- userId: String (Foreign Key to User)
- isDefault: Boolean (Indicates if this is the default folder)
- createdAt: DateTime
- updatedAt: DateTime

### Relationships
- User -> Folders (One-to-Many)
- Folder -> Quizzes (One-to-Many)
- Add folderId field to Quiz model

### Default Behavior
- When a user is created, automatically create a default "Uncategorized" folder
- All existing quizzes will belong to this default folder initially
- Users can create additional folders
- Users can move quizzes between folders