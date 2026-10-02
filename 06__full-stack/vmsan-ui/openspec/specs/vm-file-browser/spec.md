# VM File Browser Specification

## Purpose

Provides a secure, browser-based file management and navigation interface on the microVM detail page (`/vms/[id]`), enabling operators to browse directories, inspect file metadata, preview text files, upload and download files, create folders, and delete files inside running Firecracker microVMs.

## Requirements

### Requirement: Interactive File Browser Interface on VM Detail Page
The VM detail page SHALL render a dedicated filesystem browser section for the selected microVM. The browser interface MUST display the current working path, an interactive breadcrumb trail, a directory refresh action, file listing table, upload action, and folder creation action.

#### Scenario: File browser displayed on VM detail view
- **WHEN** an operator views `/vms/[id]` for a microVM
- **THEN** the page renders the file browser component below or alongside lifecycle specifications, displaying the current directory path (defaulting to `/`) and its entries

#### Scenario: Manual directory refresh
- **WHEN** an operator clicks the "Refresh" button in the file browser
- **THEN** the system re-fetches directory contents for the current path from the server and updates the file listing without reloading the entire VM detail page

### Requirement: Directory Navigation and Breadcrumbs
The file browser SHALL allow operators to navigate through directory hierarchies starting from `/`. Clicking a directory entry MUST change the current path and query directory entries from the VM. The browser MUST render clickable breadcrumb segments for each path segment enabling instant navigation to ancestor directories.

#### Scenario: Navigating into a sub-directory
- **WHEN** an operator clicks on a directory entry named `projects` while viewing `/home/ubuntu`
- **THEN** the browser updates the current path to `/home/ubuntu/projects` and fetches directory entries for that path

#### Scenario: Navigating via breadcrumbs
- **WHEN** an operator viewing `/home/ubuntu/projects` clicks the `ubuntu` breadcrumb
- **THEN** the browser navigates directly to `/home/ubuntu` and refreshes the directory listing

#### Scenario: Navigating to root
- **WHEN** an operator clicks the `Root` breadcrumb
- **THEN** the browser navigates to `/` and displays root directory entries

### Requirement: File and Directory Metadata Presentation
The file browser SHALL display sanitized metadata for each directory item, including name, entry type (`file`, `directory`, `symlink`, `unknown`), human-readable file size for regular files, and last modified timestamp when available.

#### Scenario: Viewing file and folder metadata
- **WHEN** directory entries are loaded
- **THEN** directory entries are visually distinguished with folder icons, regular files display formatted sizes (e.g. `1.4 KB`, `520 B`), and internal host paths or agent tokens are never displayed

### Requirement: Text File Preview Viewer
The system SHALL provide a read-only text file preview modal for viewing small text files located in the microVM. Text previews MUST be capped at 1 MiB. Files exceeding 1 MiB MUST NOT be previewed and MUST prompt the user to download the file instead. Binary or unsupported file types MUST display a notice indicating preview is unsupported with a download option.

#### Scenario: Previewing a valid text file
- **WHEN** an operator clicks on a text file `README.md` (size ≤ 1 MiB)
- **THEN** the system opens a read-only viewer displaying the exact file content retrieved from the microVM

#### Scenario: Large file preview restriction
- **WHEN** an operator attempts to preview a file exceeding 1 MiB
- **THEN** the viewer displays a message stating the file is too large to preview (≤ 1 MiB limit) and offers a Download action button

#### Scenario: Binary file preview handling
- **WHEN** an operator attempts to preview a binary or unsupported file
- **THEN** the viewer displays a notice indicating binary or unsupported file type and provides a Download button

### Requirement: File Upload into MicroVM Directory
The file browser SHALL provide an upload dialog permitting operators to select a local file and upload it into the current microVM directory path. The browser client and backend MUST enforce a maximum upload size of 50 MiB. Upload filenames MUST be validated as single entry names without path separators or traversal sequences. Upon successful upload, the current directory listing MUST automatically refresh.

#### Scenario: Successful file upload
- **WHEN** an operator viewing `/home/ubuntu/projects` uploads `app.py` (≤ 50 MiB)
- **THEN** the file is transmitted to the microVM via the manager and agent, a success indicator is shown, and the directory refreshes displaying `app.py`

#### Scenario: Upload exceeding size limit
- **WHEN** an operator selects a file exceeding 50 MiB for upload
- **THEN** the upload is rejected with a validation error indicating the file exceeds the 50 MiB limit

#### Scenario: Upload status indication
- **WHEN** a file upload is in progress
- **THEN** the upload dialog displays an uploading progress state and disables duplicate submissions until completion or failure

### Requirement: File Download from MicroVM
The file browser SHALL provide a download action for files inside the microVM, streaming the file payload directly from the microVM filesystem to the operator's browser. Download operations MUST enforce a maximum download size of 100 MiB.

#### Scenario: Successful file download
- **WHEN** an operator clicks Download on `/home/ubuntu/report.pdf` (≤ 100 MiB)
- **THEN** the browser triggers a file download containing the exact binary payload from the microVM with appropriate filename and headers

#### Scenario: Download exceeding size limit
- **WHEN** a download is requested for a file exceeding 100 MiB
- **THEN** the download request is rejected with HTTP 413 and error code `FILE_TOO_LARGE`

### Requirement: Directory Creation in MicroVM
The file browser SHALL provide a folder creation dialog allowing operators to create a new directory inside the current path. The directory name MUST be validated as a single entry name without path separators or traversal characters (`..`, `/`). Upon successful creation, the directory listing MUST automatically refresh.

#### Scenario: Successful folder creation
- **WHEN** an operator viewing `/home/ubuntu` enters `workspace` in the new folder dialog and submits
- **THEN** directory `/home/ubuntu/workspace` is created on the microVM and the directory view refreshes showing `workspace`

#### Scenario: Malformed directory name rejection
- **WHEN** an operator enters `../invalid` or `foo/bar` in the folder name field
- **THEN** the submission is blocked client-side and server-side with a validation error

### Requirement: Single File and Empty Directory Deletion
The file browser SHALL allow operators to delete a regular file or an empty directory with explicit user confirmation. The system MUST NOT perform recursive directory deletion. If an operator attempts to delete a non-empty directory, the operation MUST fail with an explicit error from the microVM filesystem.

#### Scenario: Deleting a file with confirmation
- **WHEN** an operator selects delete for `notes.txt` and confirms the prompt
- **THEN** the file is removed from the microVM filesystem and the file listing refreshes without `notes.txt`

#### Scenario: Attempting non-empty directory deletion
- **WHEN** an operator attempts to delete a non-empty directory `projects`
- **THEN** the operation fails, no recursive deletion is executed, and an error is displayed to the operator

### Requirement: VM Operational State Validation for Filesystem
The file browser SHALL dynamically inspect the microVM's operational status. When the VM is in any state other than `running` (such as `stopped`, `starting`, `stopping`, `error`), all filesystem operations (browsing, preview, upload, download, mkdir, delete) MUST be disabled, and an informative banner MUST notify the operator that filesystem operations require a running VM.

#### Scenario: Filesystem view on stopped VM
- **WHEN** an operator views the detail page of a stopped VM
- **THEN** directory navigation, upload, mkdir, preview, and delete actions are disabled and a banner states "Filesystem unavailable while the VM is not running"

#### Scenario: Filesystem capability restored on VM start
- **WHEN** a stopped VM is started and transitions to `running`
- **THEN** the filesystem controls are enabled and the directory listing is automatically loaded
