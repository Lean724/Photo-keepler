export interface CppCodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const CPP_QT_CODEBASE: CppCodeFile[] = [
  {
    name: 'CMakeLists.txt',
    path: 'CMakeLists.txt',
    language: 'cmake',
    description: 'Archivo CMakeLists.txt reproducible para Qt 6, SQLite, LibRaw y Exiv2.',
    content: `cmake_minimum_required(VERSION 3.22)
project(PhotoOrganizer LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configuración Qt 6
find_package(Qt6 6.5 REQUIRED COMPONENTS
    Core
    Gui
    Widgets
    Sql
    Concurrent
)

qt_standard_project_setup()

# Dependencias del sistema (100% locales, sin descargas en runtime)
find_package(SQLite3 REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_check_modules(LIBRAW REQUIRED libraw)
pkg_check_modules(EXIV2 REQUIRED exiv2)

# Archivos fuente
set(SOURCES
    src/main.cpp
    src/ui/MainWindow.cpp
    src/ui/SingleReviewWidget.cpp
    src/ui/PhotoGridView.cpp
    src/catalog/CatalogRepository.cpp
    src/catalog/LibraryScanner.cpp
    src/analysis/ExactDuplicateAnalyzer.cpp
    src/analysis/VisualDuplicateAnalyzer.cpp
    src/analysis/QualityAnalyzer.cpp
    src/analysis/BurstAnalyzer.cpp
    src/file_operations/FileOperationPlanner.cpp
    src/file_operations/FileOperationExecutor.cpp
    src/history/OperationJournal.cpp
)

set(HEADERS
    src/ui/MainWindow.h
    src/ui/SingleReviewWidget.h
    src/ui/PhotoGridView.h
    src/catalog/CatalogRepository.h
    src/catalog/LibraryScanner.h
    src/analysis/ExactDuplicateAnalyzer.h
    src/analysis/VisualDuplicateAnalyzer.h
    src/analysis/QualityAnalyzer.h
    src/analysis/BurstAnalyzer.h
    src/file_operations/FileOperationPlanner.h
    src/file_operations/FileOperationExecutor.h
    src/history/OperationJournal.h
)

qt_add_executable(photo-keepler \${SOURCES} \${HEADERS})

target_include_directories(photo-keepler PRIVATE
    src
    \${LIBRAW_INCLUDE_DIRS}
    \${EXIV2_INCLUDE_DIRS}
)

target_link_libraries(photo-keepler PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Sql
    Qt6::Concurrent
    SQLite::SQLite3
    \${LIBRAW_LIBRARIES}
    \${EXIV2_LIBRARIES}
)

# Invariante de Red: asegurar que no se vincula Qt Network
# (RF-01: Prohibidas conexiones de red durante la ejecución)
`,
  },
  {
    name: 'main.cpp',
    path: 'src/main.cpp',
    language: 'cpp',
    description: 'Punto de entrada de la aplicación Qt 6. Inicializa base de datos SQLite y MainWindow.',
    content: `/**
 * Organizador Fotográfico Offline Multiplataforma
 * Especificación Funcional v1.0 — Invariantes: Sin IA, Sin Red.
 */
#include <QApplication>
#include <QDir>
#include <QStandardPaths>
#include <QDebug>
#include "ui/MainWindow.h"
#include "catalog/CatalogRepository.h"

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);
    app.setApplicationName("PhotoKeepler");
    app.setApplicationVersion("1.0.0");
    app.setOrganizationName("PhotoKeepler");

    qInfo() << "Iniciando Photo Keepler...";

    // Inicializar SQLite local
    QString dataDir = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(dataDir);
    QString dbPath = dataDir + "/catalog.db";

    CatalogRepository catalog;
    if (!catalog.initialize(dbPath)) {
        qCritical() << "Fallo al inicializar base de datos SQLite en:" << dbPath;
        return 1;
    }

    MainWindow mainWindow(&catalog);
    mainWindow.resize(1360, 860);
    mainWindow.show();

    return app.exec();
}
`,
  },
  {
    name: 'QualityAnalyzer.h',
    path: 'src/analysis/QualityAnalyzer.h',
    language: 'cpp',
    description: 'Cabecera del analizador de calidad: varianza del Laplaciano y dimensiones.',
    content: `#pragma once
#include <QImage>
#include <cstdint>

class QualityAnalyzer {
public:
    struct QualityResult {
        double laplacianVariance = 0.0;
        bool isBlurry = false;
        int width = 0;
        int height = 0;
        uint64_t fileSizeBytes = 0;
        bool isSmall = false;
    };

    /**
     * RF-27: Métrica de nitidez por Varianza del Laplaciano
     * Convolución discreta 3x3 sobre representación en escala de grises.
     * Umbral predeterminado = 60.0. Solo sugiere, nunca descarta automáticamente.
     */
    static double computeLaplacianVariance(const QImage &image, int normalizedSize = 256);

    static QualityResult analyze(const QImage &image, uint64_t fileBytes, double blurThreshold = 60.0);
};
`,
  },
  {
    name: 'FileOperationPlanner.h',
    path: 'src/file_operations/FileOperationPlanner.h',
    language: 'cpp',
    description: 'Planificador determinista de operaciones de archivos según RF-11, RF-12, RF-13 y RF-14.',
    content: `#pragma once
#include <QString>
#include <QVector>
#include <QDateTime>

enum class OperationType { COPY, MOVE };
enum class ItemCategory { APPROVED, DISCARD };

struct PlannedItem {
    QString sourcePath;
    QString targetFolder;
    QString finalFileName;
    QString finalTargetPath;
    OperationType opType;
    ItemCategory category;
    bool collisionResolved;
    qint64 sizeBytes;
};

struct SimulationReport {
    QVector<PlannedItem> items;
    int totalApproved = 0;
    int totalDiscarded = 0;
    int totalBlockedNoDate = 0;
    qint64 totalBytes = 0;
};

class FileOperationPlanner {
public:
    /**
     * RF-11: Aprobadas -> <salida>/AAAA/MM/nombre.ext
     * RF-12: Modo Aprobadas -> COPY o MOVE
     * RF-13: Descartadas -> SIEMPRE COPIAR a <descarte>/, original intacto
     * RF-14: Conflictos de nombre -> 'nombre (1).ext' determinista, nunca sobrescribir
     */
    static SimulationReport simulateBatch(
        const QVector<struct FileRecordDto> &records,
        const QString &approvedRoot,
        const QString &discardRoot,
        OperationType approvedMode,
        bool associateSidecars
    );
};
`,
  },
  {
    name: 'DEPENDENCIES_AND_LICENSES.md',
    path: 'docs/DEPENDENCIES_AND_LICENSES.md',
    language: 'markdown',
    description: 'Matriz de dependencias, versiones y licencias auditadas.',
    content: `# Matriz de Dependencias y Licencias

| Dependencia | Versión Mínima | Licencia | Propósito |
|-------------|----------------|----------|-----------|
| **Qt 6 (Core, Gui, Widgets, Sql, Concurrent)** | 6.5.0+ | LGPLv3 / Comercial | Interfaz gráfica de escritorio, tablas, hilos concurrentes |
| **SQLite** | 3.40+ | Public Domain | Catálogo local persistente, índices, migraciones y diario |
| **LibRaw** | 0.21+ | CDDL 1.0 / LGPL 2.1 | Decodificación y extracción de previsualizaciones RAW (CR2/CR3/NEF/ARW/DNG) |
| **Exiv2** | 0.28+ | GPLv2+ | Lectura robusta de metadatos EXIF, IPTC y sidecars XMP |
| **libheif** | 1.16+ | LGPL 3.0 | Soporte para decodificación de fotos HEIC/HEIF |

### Declaración de Invariantes de Seguridad y Red
1. **Sin IA:** Ninguna biblioteca incluye redes neuronales (OpenCV DNN deshabilitado, sin PyTorch, ONNX, TensorFlow ni llamadas a APIs).
2. **Sin Tráfico Saliente:** Ningún componente incluye Qt Network ni telemetría.
3. **No Destructivo:** Descarte siempre es copia, nunca eliminación del original.
`,
  },
];
