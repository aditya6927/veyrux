class VeyruxError(Exception):
    def __init__(self, message: str = 'An unknown error occurred inside Veyrux'):
        super().__init__(message)
        self.message = message

class ParserError(VeyruxError):
    # base exception for all parsing related activities
    pass

class UnsupportedFileType(ParserError):
    pass

class FileTooLarge(ParserError):
    pass

class CorruptedFile(ParserError):
    pass

class ServiceError(VeyruxError):
    # model error, currnetly gemini, later local model
    pass
