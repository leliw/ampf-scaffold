import logging

from ampf.base import BaseAsyncFactory
from ampf.cruds import CRUDBlobService
from ampf.dependency import DependencyRegistry

from .file_model import FileMetadata

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class FileService(CRUDBlobService[FileMetadata]):
    def __init__(self, async_factory: BaseAsyncFactory):
        super().__init__(async_factory.create_blob_storage("files", FileMetadata), FileMetadata)
