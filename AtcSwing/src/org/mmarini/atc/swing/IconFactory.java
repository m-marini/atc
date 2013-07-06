/**
 * 
 */
package org.mmarini.atc.swing;

import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import javax.swing.Icon;
import javax.swing.ImageIcon;

/**
 * @author US00852
 * 
 */
public class IconFactory {

	private static IconFactory instance = new IconFactory();

	/**
	 * @return the instance
	 */
	protected static IconFactory getInstance() {
		return instance;
	}

	private Map<String, Icon> cache;

	/**
	 * 
	 */
	protected IconFactory() {
		cache = new HashMap<>();
	}

	/**
	 * 
	 * @param name
	 * @return
	 */
	public Icon createIcon(String name) {
		Icon icon = cache.get(name);
		if (icon == null) {
			URL url = getClass().getResource(name);
			if (url != null) {
				icon = new ImageIcon(url);
				cache.put(name, icon);
			}
		}
		return icon;
	}
}
