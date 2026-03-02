// This is now a client-side utility
import JSZip from 'jszip';
import type { Course } from './types';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function generateModuleHTML(title: string, content: string): string {
  const safeTitle = escapeXml(title);
  const safeContent = escapeXml(content).replace(/\n/g, '<br />');
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #005a9c; }
        .content { background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>${safeTitle}</h1>
    <div class="content">
        <p>${safeContent}</p>
    </div>
</body>
</html>
    `.trim();
}

function generateManifestXML(course: Course): string {
  const courseIdentifier = `COURSE-${course.id}`;
  const organizationIdentifier = `ORG-${course.id}`;

  const moduleItems = course.modules
    .map(
      module => `
      <item identifier="ITEM-${module.id}" identifierref="RESOURCE-${module.id}">
        <title>${escapeXml(module.title)}</title>
      </item>`
    )
    .join('');

  const moduleResources = course.modules
    .map(
      (module, index) => `
    <resource identifier="RESOURCE-${module.id}" type="webcontent" adlcp:scormtype="sco" href="content/module_${index + 1}.html">
      <file href="content/module_${index + 1}.html" />
    </resource>`
    )
    .join('');

  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="MANIFEST-${course.id}" version="1.2"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
    
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
        <lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
            <general>
                <title>
                    <langstring xml:lang="es">${escapeXml(course.title)}</langstring>
                </title>
                <description>
                    <langstring xml:lang="es">${escapeXml(course.description)}</langstring>
                </description>
            </general>
        </lom>
    </metadata>
    
    <organizations default="${organizationIdentifier}">
        <organization identifier="${organizationIdentifier}">
            <title>${escapeXml(course.title)}</title>
            ${moduleItems}
        </organization>
    </organizations>
    
    <resources>
        ${moduleResources}
    </resources>
</manifest>`;

  return xmlString.trim();
}

// This function will now generate and download the zip file on the client
export async function downloadCourseAsScormZip(course: Course) {
  const zip = new JSZip();

  // 1. Generate and add the manifest
  const manifestXml = generateManifestXML(course);
  zip.file('imsmanifest.xml', manifestXml);

  // 2. Generate and add HTML for each module
  const contentFolder = zip.folder('content');
  if (contentFolder) {
    course.modules.forEach((module, index) => {
      const moduleHtml = generateModuleHTML(module.title, module.content);
      contentFolder.file(`module_${index + 1}.html`, moduleHtml);
    });
  }

  // 3. Generate the zip file and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const safeFilename = course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `${safeFilename}_scorm.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
