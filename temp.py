import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = Integer.parseInt(sc.nextLine());
        String[] parts = sc.nextLine().split(" ");
        int[] stockPrice = new int[n];
        for (int i = 0; i < n; i++) {
            stockPrice[i] = Integer.parseInt(parts[i]);
        }

        Arrays.sort(stockPrice);

        int q = Integer.parseInt(sc.nextLine());
        while (q > 0) {
            q--;

            int query = Integer.parseInt(sc.nextLine());

            if (query > stockPrice[stockPrice.length - 1]) {
                System.out.println(-1);
                continue;
            }

            int low = 0, high = stockPrice.length - 1;
            while (low < high) {
                int mid = low + (high - low) / 2;
                if (stockPrice[mid] < query) low = mid + 1;
                if (stockPrice[mid] > query) high = mid;
                if (stockPrice[mid] == query) break;
            }

            System.out.println(stockPrice[low + (high-low)/2]);
        }
    }
}
